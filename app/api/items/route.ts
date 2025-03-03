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

    const items = await prisma.wardrobeItem.findMany({
      where: {
        userId: session.user.id,
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