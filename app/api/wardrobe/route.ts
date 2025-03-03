import { NextRequest, NextResponse } from 'next/server'
import { authenticatedHandler, validateBody } from '@/lib/api-utils'
import { wardrobeItemSchema } from '@/lib/validations'
import { prisma } from '@/lib/prisma'

// GET /api/wardrobe
export async function GET(req: NextRequest) {
  return authenticatedHandler(req, async (userId) => {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')

    const items = await prisma.wardrobeItem.findMany({
      where: {
        userId,
        ...(category && { category }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { brand: { contains: search, mode: 'insensitive' } },
            { tags: { some: { name: { contains: search, mode: 'insensitive' } } } },
          ],
        }),
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
      orderBy: {
        dateAdded: 'desc',
      },
    })

    return NextResponse.json(items)
  })
}

// POST /api/wardrobe
export async function POST(req: NextRequest) {
  return authenticatedHandler(req, async (userId) => {
    const data = await validateBody(req, wardrobeItemSchema)

    const item = await prisma.wardrobeItem.create({
      data: {
        ...data,
        userId,
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

    return NextResponse.json(item)
  })
} 