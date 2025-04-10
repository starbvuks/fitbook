import { NextResponse, NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { outfitSchema } from '@/lib/validations'
import { Prisma, PrismaClient } from '@prisma/client'
import type { OutfitItem as OutfitItemType } from '@/app/models/types'
import { z } from 'zod'

// Helper function to extract ID from URL
function getIdFromUrl(url: string): string {
  const segments = new URL(url).pathname.split('/')
  return segments[segments.length - 1]
}

// Define a partial schema specifically for PATCH, including isPublic
const outfitPatchSchema = outfitSchema.partial().extend({
  isPublic: z.boolean().optional()
});

export async function GET(req: Request) {
  try {
    const outfit = await prisma.outfit.findUnique({
      where: { id: getIdFromUrl(req.url) },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        items: {
          include: {
            wardrobeItem: {
              include: {
                images: true,
                tags: true
              }
            }
          }
        },
        seasons: {
          select: {
            id: true,
            name: true
          }
        },
        occasions: {
          select: {
            id: true,
            name: true
          }
        },
        tags: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    if (!outfit) {
      return NextResponse.json({ error: 'Outfit not found' }, { status: 404 })
    }

    // Calculate stats
    const stats = {
      timesWorn: outfit.timesWorn || 0
    }

    return NextResponse.json({
      ...outfit,
      stats
    })
  } catch (error) {
    console.error('[OUTFIT_GET]', error)
    return NextResponse.json(
      { error: 'Failed to fetch outfit' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const outfitId = params.id
    const userId = session.user.id

    // Check if user owns the outfit
    const outfit = await prisma.outfit.findUnique({
      where: { id: outfitId }
    })

    if (!outfit) {
      return NextResponse.json({ error: 'Outfit not found' }, { status: 404 })
    }

    if (outfit.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Validate request body using the specific PATCH schema
    const body = await request.json()
    const validation = outfitPatchSchema.safeParse(body)

    if (!validation.success) {
      const formattedErrors = validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      return NextResponse.json({ error: `Validation failed: ${formattedErrors}` }, { status: 400 })
    }

    const data = validation.data

    // Prepare update data - Use 'any' as specific type is problematic
    const updateData: any = {} 
    if (data.name !== undefined) updateData.name = data.name
    if (data.description !== undefined) updateData.description = data.description
    if (data.rating !== undefined) updateData.rating = data.rating
    if (data.isPublic !== undefined) updateData.isPublic = data.isPublic

    // Handle relational updates (Tags, Seasons, Occasions)
    if (data.tags) {
      updateData.tags = {
        set: [],
        connectOrCreate: data.tags.map((name: string) => ({ where: { name }, create: { name } }))
      }
    }
    if (data.seasons) {
      updateData.seasons = {
        set: [],
        connectOrCreate: data.seasons.map((name: string) => ({ where: { name }, create: { name } }))
      }
    }
    if (data.occasions) {
      updateData.occasions = {
        set: [],
        connectOrCreate: data.occasions.map((name: string) => ({ where: { name }, create: { name } }))
      }
    }

    // Transaction
    const updatedOutfit = await prisma.$transaction(async (tx: any) => {
      let newTotalCost = 0;

      // Handle item updates if present
      if (data.items) {
        // 1. Delete existing OutfitItems for this outfit
        await tx.outfitItem.deleteMany({ where: { outfitId } })

        // 2. Create new OutfitItems
        if (data.items.length > 0) {
           await tx.outfitItem.createMany({ 
             data: data.items.map((item: { wardrobeItemId: string; position: string }) => ({ 
               outfitId,
               wardrobeItemId: item.wardrobeItemId,
               position: item.position
             })) 
           });

           // 3. Recalculate total cost based on NEW items
           const itemIds = data.items.map((item: { wardrobeItemId: string }) => item.wardrobeItemId);
           const costResult = await tx.wardrobeItem.aggregate({
             where: { id: { in: itemIds } },
             _sum: { price: true }
           });
           newTotalCost = costResult._sum.price || 0;
           updateData.totalCost = newTotalCost;
        } else {
           updateData.totalCost = 0;
        }
      } else {
        // If items are not part of the update, keep the existing totalCost
        const currentOutfit = await tx.outfit.findUnique({ where: { id: outfitId }, select: { totalCost: true } });
        if (currentOutfit) {
           updateData.totalCost = currentOutfit.totalCost;
        }
      }

      // Update the outfit itself
      return tx.outfit.update({
        where: { id: outfitId },
        data: updateData,
        include: {
          items: { include: { wardrobeItem: true } },
          tags: true,
          seasons: true,
          occasions: true
        }
      });
    });

    return NextResponse.json(updatedOutfit)

  } catch (error: unknown) { 
    console.error(`Error updating outfit ${params.id}:`, error)
    
    if (error instanceof z.ZodError) {
       const formattedErrors = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
       return NextResponse.json({ error: `Validation failed: ${formattedErrors}` }, { status: 400 })
    } else if (error instanceof Error) {
       return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ error: 'Failed to update outfit' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const id = getIdFromUrl(req.url)

    // Verify outfit ownership
    const existingOutfit = await prisma.outfit.findFirst({
      where: {
        id,
        userId: session.user.id
      }
    })

    if (!existingOutfit) {
      return NextResponse.json({ error: 'Outfit not found' }, { status: 404 })
    }

    await prisma.outfit.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting outfit:', error)
    return NextResponse.json(
      { error: 'Failed to delete outfit' },
      { status: 500 }
    )
  }
} 