import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import type { SavedOutfitStub } from '@/app/models/types'

// GET /api/outfits/saved
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 })
    }

    const userId = session.user.id;

    const savedOutfitRecords = await prisma.savedOutfit.findMany({
      where: { userId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        outfit: {
          select: {
            id: true,
            name: true,
            totalCost: true,
            thumbnailUrl: true,
            rating: true,
            userId: true,
            user: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });

    const outfits: SavedOutfitStub[] = savedOutfitRecords.map(record => ({
      id: record.outfit.id,
      name: record.outfit.name,
      createdAt: record.createdAt.toISOString(),
      thumbnailUrl: record.outfit.thumbnailUrl ?? undefined,
      totalCost: record.outfit.totalCost,
      userId: record.outfit.userId,
      userName: record.outfit.user?.name ?? 'Unknown User',
      rating: record.outfit.rating ?? undefined,
    }));

    return NextResponse.json({ outfits })

  } catch (error) {
    console.error('Failed to fetch saved outfits:', error)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
} 