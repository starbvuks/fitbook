import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/outfits/save
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { outfitId } = await request.json()
    
    if (!outfitId) {
      return NextResponse.json(
        { error: 'Missing outfitId' },
        { status: 400 }
      )
    }

    const userId = session.user.id

    // Check if outfit exists (optional, but good practice)
    const outfit = await prisma.outfit.findUnique({
      where: { id: outfitId },
      select: { id: true } // Only need ID to confirm existence
    })

    if (!outfit) {
      return NextResponse.json(
        { error: 'Outfit not found' },
        { status: 404 }
      )
    }

    // Check if the outfit is already saved by the user
    const existingSave = await prisma.savedOutfit.findUnique({
      where: {
        userId_outfitId: { userId, outfitId }
      }
    })

    if (existingSave) {
      // Outfit is saved, so remove it (unsave)
      await prisma.savedOutfit.delete({
        where: {
          userId_outfitId: { userId, outfitId }
        }
      })
      return NextResponse.json({
        saved: false,
        message: 'Outfit removed from saved items'
      })
    } else {
      // Outfit is not saved, so add it (save)
      await prisma.savedOutfit.create({
        data: {
          userId,
          outfitId,
        }
      })
      return NextResponse.json({
        saved: true,
        message: 'Outfit saved successfully'
      })
    }
  } catch (error) {
    console.error('Error toggling save outfit:', error)
    return NextResponse.json(
      { error: 'Failed to toggle save status' },
      { status: 500 }
    )
  }
} 