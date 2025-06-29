import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { outfitSchema } from '@/lib/validations'
import { z } from 'zod'
import { Prisma } from '@prisma/client'

// GET /api/outfits
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const cursor = searchParams.get('cursor') as string | undefined

    const outfits = await prisma.outfit.findMany({
      where: {
        userId: session.user.id
      },
      take: limit,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        name: true,
        rating: true,
        totalCost: true,
        createdAt: true,
        items: {
          select: {
            wardrobeItem: {
              select: {
                id: true,
                category: true,
                images: {
                  select: { url: true },
                  orderBy: { isPrimary: 'desc' },
                  take: 1,
                }
              }
            }
          }
        },
        tags: { select: { id: true, name: true } },
        occasions: { select: { id: true, name: true } },
        seasons: { select: { id: true, name: true } }
      }
    })

    let nextCursor: typeof cursor | null = null
    if (outfits.length === limit) {
      nextCursor = outfits[limit - 1].id
    }

    return NextResponse.json({
      outfits,
      nextCursor
    })
  } catch (error) {
    console.error('Error fetching outfits:', error)
    return NextResponse.json(
      { error: 'Failed to fetch outfits' },
      { status: 500 }
    )
  }
}

// POST /api/outfits
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = outfitSchema.parse(body)

    // Create or connect tags
    const tagConnections = data.tags?.map((name: string) => ({
      where: { name },
      create: { name }
    })) || []

    // Create or connect seasons
    const seasonConnections = data.seasons.map((name: string) => ({
      where: { name },
      create: { name }
    }))

    // Create or connect occasions
    const occasionConnections = data.occasions.map((name: string) => ({
      where: { name },
      create: { name }
    }))

    // Calculate total cost from wardrobe items
    const totalCost = await prisma.wardrobeItem.aggregate({
      where: {
        id: {
          in: data.items.map(item => item.wardrobeItemId)
        }
      },
      _sum: {
        price: true
      }
    })

    // Create the outfit
    const outfit = await prisma.outfit.create({
      data: {
        name: data.name,
        description: data.description,
        rating: data.rating,
        totalCost: totalCost._sum.price || 0,
        user: {
          connect: {
            id: session.user.id
          }
        },
        items: {
          create: data.items.map(item => ({
            wardrobeItem: {
              connect: {
                id: item.wardrobeItemId
              }
            },
            position: item.position
          }))
        },
        tags: {
          connectOrCreate: tagConnections
        },
        seasons: {
          connectOrCreate: seasonConnections
        },
        occasions: {
          connectOrCreate: occasionConnections
        }
      },
      include: {
        items: {
          include: {
            wardrobeItem: true
          }
        },
        tags: true,
        seasons: true,
        occasions: true
      }
    })

    return NextResponse.json(outfit)
  } catch (error) {
    console.error('Error creating outfit:', error)
    return NextResponse.json(
      { error: 'Failed to create outfit' },
      { status: 500 }
    )
  }
} 