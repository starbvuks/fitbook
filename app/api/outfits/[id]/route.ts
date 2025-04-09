import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { outfitSchema, updateOutfitSchema } from '@/lib/validations'
import type { Outfit } from '@/app/models/types'

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

    // Use a validation schema if available (ensure it includes all fields)
    // For now, directly destructure, assuming validation happens elsewhere or is simple
    const {
      name,
      description,
      items, // Expecting [{ wardrobeItemId: string, position?: string }]
      seasons, // Expecting array of strings or objects like { name: string }
      occasions, // Expecting array of strings or objects like { name: string }
      tags, // Expecting array of strings or objects like { name: string }
      rating // Assuming rating might also be updated
    } = body;

    // Verify outfit exists and belongs to user
    const existingOutfit = await prisma.outfit.findUnique({
      where: { id, userId: session.user.id }
    })

    if (!existingOutfit) {
      return NextResponse.json({ error: 'Outfit not found or unauthorized' }, { status: 404 })
    }

    // Calculate total cost (only if items are being updated)
    let totalCost = existingOutfit.totalCost; // Default to existing cost
    if (items) { 
      const wardrobeItemIds = items.map((item: { wardrobeItemId: string }) => item.wardrobeItemId);
      if (wardrobeItemIds.length > 0) {
        const wardrobeItems = await prisma.wardrobeItem.findMany({
          where: { id: { in: wardrobeItemIds } }
        });
        totalCost = wardrobeItems.reduce((sum: number, item: { price: number }) => sum + item.price, 0);
      }
    }
    
    // Helper to process connectOrCreate arrays
    const processConnectOrCreate = (dataArray: any[] | undefined) => {
        if (!dataArray || !Array.isArray(dataArray) || dataArray.length === 0) {
            return { set: [] }; // Disconnect all if array is empty or undefined
        }
        return {
            set: [], // Disconnect existing before connecting new/existing
            connectOrCreate: dataArray.map((item: string | { name: string }) => {
                const name = typeof item === 'string' ? item : item.name;
                return { where: { name }, create: { name } };
            })
        };
    };

    // Prepare updates, only include fields if they are present in the body
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (rating !== undefined) updateData.rating = rating;
    if (items !== undefined) {
        updateData.totalCost = totalCost; // Update cost only if items change
        updateData.items = {
            deleteMany: {},
            create: items.map((item: { wardrobeItemId: string; position?: string }) => ({
                wardrobeItem: { connect: { id: item.wardrobeItemId } },
                position: item.position
            }))
        };
    }
    if (seasons !== undefined) updateData.seasons = processConnectOrCreate(seasons);
    if (occasions !== undefined) updateData.occasions = processConnectOrCreate(occasions);
    if (tags !== undefined) {
        updateData.tags = processConnectOrCreate(tags);
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