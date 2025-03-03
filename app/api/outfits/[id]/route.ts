import { NextRequest, NextResponse } from 'next/server'
import { authenticatedHandler, validateBody } from '@/lib/api-utils'
import { outfitSchema } from '@/lib/validations'
import { prisma } from '@/lib/prisma'
import type { PrismaClient } from '@prisma/client'

// GET /api/outfits/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return authenticatedHandler(req, async (userId) => {
    const outfit = await prisma.outfit.findUnique({
      where: {
        id: params.id,
        userId,
      },
      include: {
        items: {
          include: {
            wardrobeItem: {
              include: {
                images: true,
              },
            },
          },
        },
        tags: true,
        seasons: true,
        occasions: true,
      },
    })

    if (!outfit) {
      return NextResponse.json({ error: 'Outfit not found' }, { status: 404 })
    }

    return NextResponse.json(outfit)
  })
}

// PUT /api/outfits/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return authenticatedHandler(req, async (userId) => {
    const data = await validateBody(req, outfitSchema)

    // First check if the outfit exists and belongs to the user
    const existingOutfit = await prisma.outfit.findUnique({
      where: {
        id: params.id,
        userId,
      },
    })

    if (!existingOutfit) {
      return NextResponse.json({ error: 'Outfit not found' }, { status: 404 })
    }

    // Verify all wardrobe items belong to the user
    const wardrobeItems = await prisma.wardrobeItem.findMany({
      where: {
        id: {
          in: data.items.map(item => item.wardrobeItemId),
        },
        userId,
      },
      select: {
        id: true,
        price: true,
      },
    })

    if (wardrobeItems.length !== data.items.length) {
      return NextResponse.json(
        { error: 'One or more items not found in your wardrobe' },
        { status: 400 }
      )
    }

    const totalCost = wardrobeItems.reduce((sum: number, item: { price: number }) => sum + item.price, 0)

    // Update the outfit with a transaction to handle relations
    const outfit = await prisma.$transaction(async (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'>) => {
      // Delete existing relations
      await tx.outfitItem.deleteMany({
        where: { outfitId: params.id },
      })
      await tx.outfit.update({
        where: { id: params.id },
        data: {
          tags: { set: [] },
          seasons: { set: [] },
          occasions: { set: [] },
        },
      })

      // Update with new data
      return tx.outfit.update({
        where: { id: params.id },
        data: {
          name: data.name,
          description: data.description,
          totalCost,
          rating: data.rating,
          items: {
            create: data.items.map(item => ({
              position: item.position,
              wardrobeItem: {
                connect: { id: item.wardrobeItemId },
              },
            })),
          },
          tags: {
            connectOrCreate: data.tags.map(tag => ({
              where: { name: tag },
              create: { name: tag },
            })),
          },
          seasons: {
            connectOrCreate: data.seasons.map(season => ({
              where: { name: season },
              create: { name: season },
            })),
          },
          occasions: {
            connectOrCreate: data.occasions.map(occasion => ({
              where: { name: occasion },
              create: { name: occasion },
            })),
          },
        },
        include: {
          items: {
            include: {
              wardrobeItem: {
                include: {
                  images: true,
                },
              },
            },
          },
          tags: true,
          seasons: true,
          occasions: true,
        },
      })
    })

    return NextResponse.json(outfit)
  })
}

// DELETE /api/outfits/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return authenticatedHandler(req, async (userId) => {
    // First check if the outfit exists and belongs to the user
    const outfit = await prisma.outfit.findUnique({
      where: {
        id: params.id,
        userId,
      },
    })

    if (!outfit) {
      return NextResponse.json({ error: 'Outfit not found' }, { status: 404 })
    }

    // Delete the outfit and update user stats in a transaction
    await prisma.$transaction(async (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'>) => {
      await tx.outfit.delete({
        where: { id: params.id },
      })

      await tx.userProfile.update({
        where: { userId },
        data: {
          stats: {
            update: {
              outfitCount: {
                decrement: 1,
              },
            },
          },
        },
      })
    })

    return NextResponse.json({ success: true })
  })
} 