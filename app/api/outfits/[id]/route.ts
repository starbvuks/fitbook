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
    const { name, description, items, seasons, occasions } = body

    // Verify outfit exists and belongs to user
    const existingOutfit = await prisma.outfit.findUnique({
      where: {
        id,
        userId: session.user.id
      }
    })

    if (!existingOutfit) {
      return NextResponse.json({ error: 'Outfit not found' }, { status: 404 })
    }

    // Calculate total cost
    const wardrobeItems = await prisma.wardrobeItem.findMany({
      where: {
        id: {
          in: items.map((item: any) => item.wardrobeItemId)
        }
      }
    })

    const totalCost = wardrobeItems.reduce((sum, item) => sum + item.price, 0)

    // Update outfit
    const updatedOutfit = await prisma.outfit.update({
      where: {
        id
      },
      data: {
        name,
        description,
        totalCost,
        seasons: {
          connectOrCreate: seasons.map((season: any) => ({
            where: { name: season.name },
            create: { name: season.name }
          }))
        },
        occasions: {
          connectOrCreate: occasions.map((occasion: any) => ({
            where: { name: occasion.name },
            create: { name: occasion.name }
          }))
        },
        tags: {
          connectOrCreate: body.tags?.map((tag: any) => ({
            where: { name: tag.name },
            create: { name: tag.name }
          })) || []
        }
      },
      include: {
        items: {
          include: {
            wardrobeItem: {
              include: {
                images: true,
                tags: true,
                seasons: true,
                occasions: true
              }
            }
          }
        },
        tags: true,
        seasons: true,
        occasions: true
      }
    })

    // Delete existing items
    await prisma.outfitItem.deleteMany({
      where: {
        outfitId: id
      }
    })

    // Create new items
    await prisma.outfitItem.createMany({
      data: items.map((item: any) => ({
        outfitId: id,
        wardrobeItemId: item.wardrobeItemId,
        position: item.position
      }))
    })

    // Fetch the final outfit with all relations
    const finalOutfit = await prisma.outfit.findUnique({
      where: {
        id
      },
      include: {
        items: {
          include: {
            wardrobeItem: {
              include: {
                images: true,
                tags: true,
                seasons: true,
                occasions: true
              }
            }
          }
        },
        tags: true,
        seasons: true,
        occasions: true
      }
    })

    return NextResponse.json(finalOutfit)
  } catch (error) {
    console.error('Error updating outfit:', error)
    return NextResponse.json(
      { error: 'Failed to update outfit' },
      { status: 500 }
    )
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