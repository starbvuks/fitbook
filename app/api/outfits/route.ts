import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { outfitSchema } from '@/lib/validations'

// GET /api/outfits
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const cursor = searchParams.get('cursor')

    const outfits = await prisma.outfit.findMany({
      where: {
        userId: session.user.id
      },
      take: limit,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: {
        createdAt: 'desc'
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

    const nextCursor = outfits.length === limit ? outfits[outfits.length - 1].id : null

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