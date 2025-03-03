import { NextRequest, NextResponse } from 'next/server'
import { authenticatedHandler, validateBody } from '@/lib/api-utils'
import { outfitSchema } from '@/lib/validations'
import { prisma } from '@/lib/prisma'
import type { PrismaClient } from '@prisma/client'

// GET /api/outfits
export async function GET(req: NextRequest) {
  return authenticatedHandler(req, async (userId) => {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search')
    const season = searchParams.get('season')
    const occasion = searchParams.get('occasion')

    const outfits = await prisma.outfit.findMany({
      where: {
        userId,
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { tags: { some: { name: { contains: search, mode: 'insensitive' } } } },
          ],
        }),
        ...(season && season !== 'all' && {
          seasons: {
            some: { name: season },
          },
        }),
        ...(occasion && occasion !== 'all' && {
          occasions: {
            some: { name: occasion },
          },
        }),
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
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(outfits)
  })
}

// POST /api/outfits
export async function POST(req: NextRequest) {
  return authenticatedHandler(req, async (userId) => {
    const data = await validateBody(req, outfitSchema)

    // Calculate total cost from wardrobe items
    const wardrobeItems = await prisma.wardrobeItem.findMany({
      where: {
        id: {
          in: data.items.map(item => item.wardrobeItemId),
        },
        userId, // Ensure user owns all items
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

    // Create the outfit with a transaction to ensure all relations are created
    const outfit = await prisma.$transaction(async (tx) => {
      // Create the outfit
      const newOutfit = await tx.outfit.create({
        data: {
          name: data.name,
          description: data.description,
          totalCost,
          rating: data.rating,
          userId,
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

      // Update user stats
      await tx.userProfile.update({
        where: { userId },
        data: {
          stats: {
            update: {
              outfitCount: {
                increment: 1,
              },
            },
          },
        },
      })

      return newOutfit
    })

    return NextResponse.json(outfit)
  })
} 