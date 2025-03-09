import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

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

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const id = await params.id

    const body = await request.json()
    if (!body) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const data = updateItemSchema.parse(body)

    // Verify item ownership
    const existingItem = await prisma.wardrobeItem.findFirst({
      where: {
        id,
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
      where: { id },
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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 })
    }

    const id = await params.id

    const item = await prisma.wardrobeItem.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        images: true,
        tags: true,
        colors: true,
        seasons: true,
        occasions: true,
      },
    })

    if (!item) {
      return new Response('Item not found', { status: 404 })
    }

    return Response.json(item)
  } catch (error) {
    console.error('Error fetching item:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const id = await params.id

    // Verify item ownership
    const existingItem = await prisma.wardrobeItem.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    })

    if (!existingItem) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    await prisma.wardrobeItem.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting item:', error)
    return NextResponse.json(
      { error: 'Failed to delete item' },
      { status: 500 }
    )
  }
} 