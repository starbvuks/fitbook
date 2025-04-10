import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { outfitSchema } from '@/lib/validations'
import { Prisma, PrismaClient } from '@prisma/client'
import type { OutfitItem as OutfitItemType, Outfit } from '@/app/models/types'
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

// GET /api/outfits/[id]
export async function GET(request: NextRequest, { params }: any) {
  try {
    const session = await getServerSession(authOptions)

    // Allow fetching ANY outfit, but only include sensitive details if owner
    const outfit = await prisma.outfit.findUnique({
      where: { id: params.id },
      include: {
        items: { include: { wardrobeItem: { include: { images: true } } } },
        tags: true,
        seasons: true,
        occasions: true,
        user: { select: { id: true, name: true, username: true, image: true } } 
      }
    });

    if (!outfit) {
      return NextResponse.json({ error: 'Outfit not found' }, { status: 404 })
    }

    // If outfit isn't public and user is not owner, return forbidden
    if (!outfit.isPublic && outfit.userId !== session?.user?.id) {
       return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json(outfit)

  } catch (error) {
    console.error(`Error fetching outfit ${params.id}:`, error)
    return NextResponse.json({ error: 'Failed to fetch outfit' }, { status: 500 })
  }
}

// PATCH /api/outfits/[id]
export async function PATCH(request: NextRequest, { params }: any) {
  const outfitId = params.id;
  
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    const outfit = await prisma.outfit.findUnique({
      where: { id: outfitId }
    })

    if (!outfit) {
      return NextResponse.json({ error: 'Outfit not found' }, { status: 404 })
    }

    if (outfit.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const validation = outfitPatchSchema.safeParse(body)
    if (!validation.success) {
       const formattedErrors = validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
       return NextResponse.json({ error: `Validation failed: ${formattedErrors}` }, { status: 400 })
    }
    const data = validation.data;

    const updateData: any = {} 
    if (data.name !== undefined) updateData.name = data.name
    if (data.description !== undefined) updateData.description = data.description
    if (data.rating !== undefined) updateData.rating = data.rating
    if (data.isPublic !== undefined) updateData.isPublic = data.isPublic

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

    // Increase transaction timeout to 30 seconds
    const updatedOutfit = await prisma.$transaction(async (tx: any) => {
      let newTotalCost = 0;

      if (data.items) {
        await tx.outfitItem.deleteMany({ where: { outfitId } });

        if (data.items.length > 0) {
          await tx.outfitItem.createMany({ 
            data: data.items.map((item: { wardrobeItemId: string; position: string }) => ({ 
              outfitId,
              wardrobeItemId: item.wardrobeItemId,
              position: item.position
            })) 
          });

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
        const currentOutfit = await tx.outfit.findUnique({ where: { id: outfitId }, select: { totalCost: true } });
        if (currentOutfit) {
           updateData.totalCost = currentOutfit.totalCost;
        }
      }

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
    }, {
      timeout: 30000 // Increase timeout to 30 seconds
    });

    return NextResponse.json(updatedOutfit)

  } catch (error: unknown) { 
    console.error(`Error updating outfit ${outfitId}:`, error instanceof Error ? error.message : 'Unknown error')
    
    if (error instanceof z.ZodError) {
       const formattedErrors = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
       return NextResponse.json({ error: `Validation failed: ${formattedErrors}` }, { status: 400 })
    } else if (error instanceof Error) {
       return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ error: 'Failed to update outfit' }, { status: 500 })
  }
}

// DELETE /api/outfits/[id]
export async function DELETE(request: NextRequest, { params }: any) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const outfitId = params.id
    const userId = session.user.id

    // Verify ownership before deleting
    const outfit = await prisma.outfit.findUnique({ 
      where: { id: outfitId, userId: userId }
    })

    if (!outfit) {
      // If not found OR not owned by user
      return NextResponse.json({ error: 'Outfit not found or unauthorized' }, { status: 404 })
    }

    await prisma.outfit.delete({ 
      where: { id: outfitId }
    })

    return NextResponse.json({ message: 'Outfit deleted' })

  } catch (error) {
    console.error(`Error deleting outfit ${params.id}:`, error)
    return NextResponse.json({ error: 'Failed to delete outfit' }, { status: 500 })
  }
} 