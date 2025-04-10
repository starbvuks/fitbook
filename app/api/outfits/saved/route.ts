import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/outfits/saved
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    const savedOutfitEntries = await prisma.savedOutfit.findMany({
      where: {
        userId: userId
      },
      select: {
        outfitId: true // Select only the outfit IDs
      }
    })

    const savedOutfitIds = savedOutfitEntries.map(entry => entry.outfitId)

    if (savedOutfitIds.length === 0) {
      return NextResponse.json({ outfits: [] }) // Return empty array if nothing saved
    }

    // Fetch the full outfit details for the saved IDs
    const savedOutfits = await prisma.outfit.findMany({
      where: {
        id: {
          in: savedOutfitIds
        }
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
        seasons: true,
        user: {
          select: { // Include user details for consistency if needed
            id: true,
            name: true,
            username: true,
            image: true
          }
        }
      }
    })

    return NextResponse.json({ outfits: savedOutfits })

  } catch (error) {
    console.error('Error fetching saved outfits:', error)
    return NextResponse.json(
      { error: 'Failed to fetch saved outfits' },
      { status: 500 }
    )
  }
} 