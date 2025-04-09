import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

interface SaveRouteParams {
  params: {
    id: string // Outfit ID
  }
}

// POST /api/outfits/[id]/save
export async function POST(request: NextRequest, { params }: SaveRouteParams) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 })
  }

  const userId = session.user.id
  const outfitId = params.id

  if (!outfitId) {
    return NextResponse.json({ message: 'Outfit ID is required' }, { status: 400 })
  }

  try {
    // 1. Check if outfit exists
    const outfit = await prisma.outfit.findUnique({
      where: { id: outfitId },
      select: { id: true } // Minimal check
    })

    if (!outfit) {
      return NextResponse.json({ message: 'Outfit not found' }, { status: 404 })
    }

    // 2. Check if already saved (using the SavedOutfit model)
    const existingSave = await prisma.savedOutfit.findUnique({
      where: {
        userId_outfitId: { userId, outfitId },
      },
    })

    if (existingSave) {
      return NextResponse.json({ message: 'Outfit already saved' }, { status: 200 })
    }

    // 3. Create the save record (using the SavedOutfit model)
    const savedOutfit = await prisma.savedOutfit.create({
      data: {
        userId,
        outfitId,
      },
    })

    return NextResponse.json(savedOutfit, { status: 201 })

  } catch (error) {
    console.error('Failed to save outfit:', error)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}

// DELETE /api/outfits/[id]/save
export async function DELETE(request: NextRequest, { params }: SaveRouteParams) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 })
  }

  const userId = session.user.id
  const outfitId = params.id

  if (!outfitId) {
    return NextResponse.json({ message: 'Outfit ID is required' }, { status: 400 })
  }

  try {
    // Find and delete the save record (using the SavedOutfit model)
    await prisma.savedOutfit.delete({
      where: {
        userId_outfitId: { userId, outfitId },
      },
    })

    return NextResponse.json({ message: 'Outfit unsaved successfully' }, { status: 200 })

  } catch (error: any) {
    // Check if the error is Prisma's "Record to delete does not exist."
    if (error.code === 'P2025') {
       return NextResponse.json({ message: 'Outfit was not saved by this user' }, { status: 404 })
    }
    console.error('Failed to unsave outfit:', error)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
} 