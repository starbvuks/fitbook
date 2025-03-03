import { NextRequest, NextResponse } from 'next/server'
import { authenticatedHandler, validateBody } from '@/lib/api-utils'
import { wardrobeItemSchema } from '@/lib/validations'
import { prisma } from '@/lib/prisma'
import type { PrismaTransaction } from '@/types/prisma'

// GET /api/wardrobe/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return authenticatedHandler(req, async (userId) => {
    const item = await prisma.wardrobeItem.findUnique({
      where: {
        id: params.id,
        userId,
      },
      include: {
        images: {
          include: {
            colors: true,
          },
        },
        colors: true,
        tags: true,
        seasons: true,
        occasions: true,
      },
    })

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    return NextResponse.json(item)
  })
}

// PUT /api/wardrobe/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return authenticatedHandler(req, async (userId) => {
    const data = await validateBody(req, wardrobeItemSchema)

    // First check if the item exists and belongs to the user
    const existingItem = await prisma.wardrobeItem.findUnique({
      where: {
        id: params.id,
        userId,
      },
    })

    if (!existingItem) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    // Update the item with a transaction to handle relations
    const item = await prisma.$transaction(async (tx: PrismaTransaction) => {
      // Delete existing relations
      await tx.image.deleteMany({
        where: { itemId: params.id },
      })
      await tx.wardrobeItem.update({
        where: { id: params.id },
        data: {
          colors: { deleteMany: {} },
          tags: { set: [] },
          seasons: { set: [] },
          occasions: { set: [] },
        },
      })

      // Update with new data
      return tx.wardrobeItem.update({
        where: { id: params.id },
        data: {
          ...data,
          images: {
            create: data.images.map(image => ({
              ...image,
              colors: {
                create: image.colors || [],
              },
            })),
          },
          colors: {
            create: data.colors,
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
          images: {
            include: {
              colors: true,
            },
          },
          colors: true,
          tags: true,
          seasons: true,
          occasions: true,
        },
      })
    })

    return NextResponse.json(item)
  })
}

// DELETE /api/wardrobe/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return authenticatedHandler(req, async (userId) => {
    // First check if the item exists and belongs to the user
    const item = await prisma.wardrobeItem.findUnique({
      where: {
        id: params.id,
        userId,
      },
    })

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    // Delete the item and all its relations
    await prisma.wardrobeItem.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  })
} 