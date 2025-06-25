import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { Prisma } from '@prisma/client'

const createItemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.enum(['headwear','tops', 'bottoms', 'outerwear', 'shoes', 'accessories'], {
    required_error: "Category is required"
  }),
  brand: z.string().nullable().optional(),
  price: z.number().min(0, "Price must be positive"),
  priceCurrency: z.enum(['USD', 'EUR', 'GBP', 'JPY', 'INR', 'CAD', 'AUD']).default('USD'),
  purchaseUrl: z.string().url().nullable().optional(),
  size: z.string().nullable().optional(),
  material: z.string().nullable().optional(),
  condition: z.string().nullable().optional(),
  isOwned: z.boolean().default(false).optional(),
  seasons: z.array(z.string()).default([]).optional(),
  occasions: z.array(z.string()).default([]).optional(),
  tags: z.array(z.string()).default([]).optional(),
  notes: z.string().nullable().optional(),
  images: z.array(z.object({
    url: z.string().url(),
    publicId: z.string(),
    colors: z.array(z.object({
      hex: z.string(),
      prevalence: z.number(),
    })).optional().default([]),
    isPrimary: z.boolean().optional(),
  })).optional().default([]),
})

const updateItemSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  category: z.enum(['tops', 'bottoms', 'outerwear', 'shoes', 'accessories']).optional(),
  brand: z.string().nullable().optional(),
  price: z.number().nullable().optional(),
  purchaseUrl: z.string().url().nullable().optional(),
  size: z.string().nullable().optional(),
  material: z.string().nullable().optional(),
  condition: z.string().nullable().optional(),
  isOwned: z.boolean().optional(),
  seasons: z.array(z.string()).optional(),
  occasions: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().nullable().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    if (!body) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const data = createItemSchema.parse(body)

    const item = await prisma.wardrobeItem.create({
      data: {
        userId: session.user.id,
        name: data.name,
        category: data.category,
        brand: data.brand || null,
        price: data.price,
        priceCurrency: data.priceCurrency,
        purchaseUrl: data.purchaseUrl || null,
        size: data.size || null,
        material: data.material || null,
        condition: data.condition || null,
        isOwned: data.isOwned,
        notes: data.notes || null,
        images: {
          create: data.images?.map(image => ({
            url: image.url,
            publicId: image.publicId,
            isPrimary: image.isPrimary || false,
            colors: {
              create: image.colors?.map(color => ({
                hex: color.hex,
                prevalence: color.prevalence,
              })) || [],
            },
          })) || [],
        },
        tags: {
          connectOrCreate: data.tags?.map(tag => ({
            where: { name: tag },
            create: { name: tag },
          })) || [],
        },
        seasons: {
          connectOrCreate: data.seasons?.map(season => ({
            where: { name: season },
            create: { name: season },
          })) || [],
        },
        occasions: {
          connectOrCreate: data.occasions?.map(occasion => ({
            where: { name: occasion },
            create: { name: occasion },
          })) || [],
        },
      },
      include: {
        images: {
          include: {
            colors: true,
          },
        },
        tags: true,
        seasons: true,
        occasions: true,
      },
    })

    if (!item) {
      console.error('Item creation failed: returned null')
      return NextResponse.json({ error: 'Failed to create item' }, { status: 500 })
    }

    return NextResponse.json(item)
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error creating item:', error.message, error.stack)
    } else {
      console.error('Unknown error:', error)
    }
    return NextResponse.json(
      { error: 'Failed to create item', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = session.user.id

  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '30')
  const cursor = searchParams.get('cursor') as string | undefined
  const category = searchParams.get('category')
  const isOwned = searchParams.get('isOwned')
  const searchQuery = searchParams.get('query')
  const minPrice = searchParams.get('minPrice')
  const maxPrice = searchParams.get('maxPrice')
  const sortBy = searchParams.get('sortBy') || 'createdAt'
  const sortOrder = searchParams.get('sortOrder') || 'desc'

  try {
    const whereClause: Prisma.WardrobeItemWhereInput = {
      userId: userId,
      ...(category && category !== 'all' && { category: category }),
      ...(isOwned !== null && isOwned !== undefined && { isOwned: isOwned === 'true' }),
      ...(searchQuery && {
        OR: [
          { name: { contains: searchQuery, mode: 'insensitive' } },
          { brand: { contains: searchQuery, mode: 'insensitive' } },
          { tags: { some: { name: { contains: searchQuery, mode: 'insensitive' } } } }
        ]
      }),
      ...(minPrice && { price: { gte: parseFloat(minPrice) } }),
      ...(maxPrice && { price: { lte: parseFloat(maxPrice) } })
    }
    
    if (minPrice && maxPrice) {
      whereClause.price = {
        gte: parseFloat(minPrice),
        lte: parseFloat(maxPrice)
      }
    }
    
    const orderByClause: Prisma.WardrobeItemOrderByWithRelationInput = {}
    if (sortBy === 'price' || sortBy === 'createdAt' || sortBy === 'lastWorn' || sortBy === 'timesWorn') {
       orderByClause[sortBy] = sortOrder as Prisma.SortOrder;
    } else {
        orderByClause['createdAt'] = 'desc';
    }

    const items = await prisma.wardrobeItem.findMany({
      where: whereClause,
      take: limit,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: orderByClause,
      include: {
        images: true,
        tags: true,
        seasons: true,
        occasions: true
      }
    })

    let nextCursor: typeof cursor | null = null
    if (items.length === limit) {
      nextCursor = items[limit - 1].id
    }

    return NextResponse.json({ items, nextCursor })

  } catch (error) {
    console.error('Error fetching wardrobe items:', error)
    return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    if (!body) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const data = updateItemSchema.parse(body)
    const itemId = request.url.split('/').pop()

    if (!itemId) {
      return NextResponse.json({ error: 'Item ID is required' }, { status: 400 })
    }

    const existingItem = await prisma.wardrobeItem.findFirst({
      where: {
        id: itemId,
        userId: session.user.id,
      },
    })

    if (!existingItem) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    const updateData = {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.category !== undefined && { category: data.category }),
      ...(data.brand !== undefined && { brand: data.brand }),
      ...(data.price !== undefined && { price: data.price ?? 0 }),
      ...(data.purchaseUrl !== undefined && { purchaseUrl: data.purchaseUrl }),
      ...(data.size !== undefined && { size: data.size }),
      ...(data.material !== undefined && { material: data.material }),
      ...(data.condition !== undefined && { condition: data.condition }),
      ...(data.isOwned !== undefined && { isOwned: data.isOwned }),
      ...(data.notes !== undefined && { notes: data.notes }),
      ...(data.seasons !== undefined && {
        seasons: {
          set: [],
          connectOrCreate: data.seasons.map(season => ({
            where: { name: season },
            create: { name: season },
          })),
        },
      }),
      ...(data.occasions !== undefined && {
        occasions: {
          set: [],
          connectOrCreate: data.occasions.map(occasion => ({
            where: { name: occasion },
            create: { name: occasion },
          })),
        },
      }),
      ...(data.tags !== undefined && {
        tags: {
          set: [],
          connectOrCreate: data.tags.map(tag => ({
            where: { name: tag },
            create: { name: tag },
          })),
        },
      }),
    }

    const updatedItem = await prisma.wardrobeItem.update({
      where: { id: itemId },
      data: updateData,
      include: {
        images: {
          include: {
            colors: true,
          },
        },
        tags: true,
        seasons: true,
        occasions: true,
      },
    })

    return NextResponse.json(updatedItem)
  } catch (error) {
    console.error('Error updating item:', error)
    return NextResponse.json(
      { error: 'Failed to update item' },
      { status: 500 }
    )
  }
} 