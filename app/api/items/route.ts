import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createItemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.enum(['tops', 'bottoms', 'dresses', 'outerwear', 'shoes', 'accessories'], {
    required_error: "Category is required"
  }),
  brand: z.string().nullable().optional(),
  price: z.number().nullable().optional(),
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
  category: z.enum(['tops', 'bottoms', 'dresses', 'outerwear', 'shoes', 'accessories']).optional(),
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
        brand: data.brand || undefined,
        price: data.price || 0,
        purchaseUrl: data.purchaseUrl || undefined,
        size: data.size || undefined,
        material: data.material || undefined,
        condition: data.condition || undefined,
        isOwned: data.isOwned,
        notes: data.notes || undefined,
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
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const isOwned = searchParams.get('isOwned')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')

    const items = await prisma.wardrobeItem.findMany({
      where: {
        userId: session.user.id,
        ...(category && { category }),
        ...(isOwned !== null && { isOwned: isOwned === 'true' }),
        ...(minPrice && { price: { gte: parseFloat(minPrice) } }),
        ...(maxPrice && { price: { lte: parseFloat(maxPrice) } }),
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
        tags: true,
        seasons: true,
        occasions: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(items)
  } catch (error) {
    console.error('Error fetching items:', error)
    return NextResponse.json(
      { error: 'Failed to fetch items' },
      { status: 500 }
    )
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

    // Verify item ownership
    const existingItem = await prisma.wardrobeItem.findFirst({
      where: {
        id: itemId,
        userId: session.user.id,
      },
    })

    if (!existingItem) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    // Transform the data to match Prisma's expected types
    const updateData = {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.category !== undefined && { category: data.category }),
      ...(data.brand !== undefined && { brand: data.brand }),
      ...(data.price !== undefined && { price: data.price ?? 0 }), // Convert null to 0
      ...(data.purchaseUrl !== undefined && { purchaseUrl: data.purchaseUrl }),
      ...(data.size !== undefined && { size: data.size }),
      ...(data.material !== undefined && { material: data.material }),
      ...(data.condition !== undefined && { condition: data.condition }),
      ...(data.isOwned !== undefined && { isOwned: data.isOwned }),
      ...(data.notes !== undefined && { notes: data.notes }),
      ...(data.seasons !== undefined && {
        seasons: {
          set: [], // Clear existing connections
          connectOrCreate: data.seasons.map(season => ({
            where: { name: season },
            create: { name: season },
          })),
        },
      }),
      ...(data.occasions !== undefined && {
        occasions: {
          set: [], // Clear existing connections
          connectOrCreate: data.occasions.map(occasion => ({
            where: { name: occasion },
            create: { name: occasion },
          })),
        },
      }),
      ...(data.tags !== undefined && {
        tags: {
          set: [], // Clear existing connections
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