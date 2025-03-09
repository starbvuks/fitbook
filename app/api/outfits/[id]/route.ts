import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { outfitSchema, updateOutfitSchema } from '@/lib/validations'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(
  request: NextRequest,
  props: RouteParams
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params = await props.params
    const { id } = params

    const outfit = await prisma.outfit.findFirst({
      where: {
        id,
        userId: session.user.id
      },
      include: {
        items: {
          include: {
            wardrobeItem: {
              include: {
                images: true
              }
            }
          }
        },
        tags: true,
        occasions: true,
        seasons: true
      }
    })

    if (!outfit) {
      return NextResponse.json({ error: 'Outfit not found' }, { status: 404 })
    }

    return NextResponse.json(outfit)
  } catch (error) {
    console.error('Error fetching outfit:', error)
    return NextResponse.json(
      { error: 'Failed to fetch outfit' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  props: RouteParams
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params = await props.params
    const { id } = params

    const body = await request.json()
    const data = updateOutfitSchema.parse(body)

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

    // Calculate total cost if items are being updated
    let totalCost = existingOutfit.totalCost
    if (data.items) {
      const wardrobeItems = await prisma.wardrobeItem.findMany({
        where: {
          id: {
            in: data.items.map((item: { wardrobeItemId: string }) => item.wardrobeItemId)
          }
        },
        select: {
          price: true
        }
      })
      totalCost = wardrobeItems.reduce((sum, item) => sum + (item.price || 0), 0)
    }

    const updateData = {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.rating !== undefined && { rating: data.rating }),
      ...(data.items !== undefined && {
        items: {
          deleteMany: {},
          create: data.items.map((item: { wardrobeItemId: string; position: string }) => ({
            wardrobeItemId: item.wardrobeItemId,
            position: item.position
          }))
        }
      }),
      ...(data.tags !== undefined && {
        tags: {
          set: [],
          connectOrCreate: data.tags.map((name: string) => ({
            where: { name },
            create: { name }
          }))
        }
      }),
      ...(data.occasions !== undefined && {
        occasions: {
          set: [],
          connectOrCreate: data.occasions.map((name: string) => ({
            where: { name },
            create: { name }
          }))
        }
      }),
      ...(data.seasons !== undefined && {
        seasons: {
          set: [],
          connectOrCreate: data.seasons.map((name: string) => ({
            where: { name },
            create: { name }
          }))
        }
      }),
      totalCost
    }

    const updatedOutfit = await prisma.outfit.update({
      where: { id },
      data: updateData,
      include: {
        items: {
          include: {
            wardrobeItem: {
              include: {
                images: true
              }
            }
          }
        },
        tags: true,
        occasions: true,
        seasons: true
      }
    })

    return NextResponse.json(updatedOutfit)
  } catch (error) {
    console.error('Error updating outfit:', error)
    return NextResponse.json(
      { error: 'Failed to update outfit' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  props: RouteParams
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params = await props.params
    const { id } = params

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