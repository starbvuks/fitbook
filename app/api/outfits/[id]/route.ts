import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { outfitSchema, updateOutfitSchema } from '@/lib/validations'
import type { Outfit } from '@/app/models/types'
import { z } from 'zod'

// Helper function to extract ID from URL
function getIdFromUrl(url: string): string {
  const segments = new URL(url).pathname.split('/')
  return segments[segments.length - 1]
}

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

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const id = getIdFromUrl(req.url)

    const body = await req.json()
    if (!body) {
      return NextResponse.json({ error: 'Request body is empty' }, { status: 400 })
    }

    // Extract isPublic and validate the rest of the body
    const { isPublic, ...restOfBody } = body;
    const data = updateOutfitSchema.parse(restOfBody);

    // Verify outfit exists and belongs to user
    const existingOutfit = await prisma.outfit.findUnique({
      where: { id, userId: session.user.id }
    })

    if (!existingOutfit) {
      return NextResponse.json({ error: 'Outfit not found or unauthorized' }, { status: 404 })
    }

    // Calculate total cost (only if items are being updated)
    let totalCost = existingOutfit.totalCost; // Default to existing cost
    if (data.items) { 
      const wardrobeItemIds = data.items.map((item: { wardrobeItemId: string }) => item.wardrobeItemId);
      if (wardrobeItemIds.length > 0) {
        const wardrobeItems = await prisma.wardrobeItem.findMany({
          where: { id: { in: wardrobeItemIds } }
        });
        totalCost = wardrobeItems.reduce((sum: number, item: { price: number }) => sum + item.price, 0);
      }
    }
    
    // Helper to process connectOrCreate arrays
    const processConnectOrCreate = (dataArray: any[] | undefined) => {
        if (dataArray === undefined) return undefined; 
        if (!Array.isArray(dataArray) || dataArray.length === 0) {
            return { set: [] }; 
        }
        return {
            set: [], 
            connectOrCreate: dataArray.map((item: string | { name: string }) => {
                const name = typeof item === 'string' ? item : item.name;
                return { where: { name }, create: { name } };
            })
        };
    };

    // Prepare updates, only include fields if they are present in the body
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.rating !== undefined) updateData.rating = data.rating;
    if (isPublic !== undefined) updateData.isPublic = isPublic;
    if (data.items !== undefined) {
        updateData.totalCost = totalCost; 
        updateData.items = {
            deleteMany: {},
            create: data.items.map((item: { wardrobeItemId: string; position?: string }) => ({
                wardrobeItem: { connect: { id: item.wardrobeItemId } },
                position: item.position ?? 'default' 
            }))
        };
    }
    const seasonsUpdate = processConnectOrCreate(data.seasons);
    if (seasonsUpdate !== undefined) updateData.seasons = seasonsUpdate;
    
    const occasionsUpdate = processConnectOrCreate(data.occasions);
    if (occasionsUpdate !== undefined) updateData.occasions = occasionsUpdate;

    const tagsUpdate = processConnectOrCreate(data.tags);
    if (tagsUpdate !== undefined) {
        updateData.tags = tagsUpdate;
    }

    // Update outfit
    const updatedOutfit = await prisma.outfit.update({
      where: { id },
      data: updateData,
      include: { // Include relations in the response
        items: { include: { wardrobeItem: { include: { images: true } } } },
        tags: true,
        seasons: true,
        occasions: true,
        user: { select: { id: true, name: true, image: true } } // Include user info
      }
    })

    return NextResponse.json(updatedOutfit)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    console.error("Error updating outfit:", error)
    return NextResponse.json({ error: "Failed to update outfit" }, { status: 500 })
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