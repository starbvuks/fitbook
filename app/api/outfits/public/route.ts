import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/outfits/public
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id

  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '20')
  const cursor = searchParams.get('cursor')
  const search = searchParams.get('search')
  // TODO: Add season, occasion, sort filters

  try {
    const whereClause: any = {
      isPublic: true,
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Optionally exclude the current user's outfits
    // if (userId) {
    //   whereClause.NOT = { userId: userId };
    // }

    const outfits = await prisma.outfit.findMany({
      where: whereClause,
      take: limit + 1, // Fetch one extra to determine if there's a next page
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: {
        createdAt: 'desc', // Default sort
        // TODO: Add other sort options (popularity?)
      },
      include: {
        items: {
          include: {
            wardrobeItem: {
              include: {
                images: true,
              },
            },
          },
        },
        tags: true,
        occasions: true,
        seasons: true,
        user: { // Include basic user info
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
        // _count: { // REMOVED - Caused issues without relationJoins
        //   select: {
        //     // upvotesReceived: true, // Still causing error
        //     savedBy: true,
        //   },
        // },
        // upvotesReceived: { // REMOVED - simplified for now
        //   where: { userId: userId }, // Check if current user upvoted
        //   select: { id: true },
        // },
        savedBy: { // Keep this to check if current user saved
          where: { userId: userId },
          select: { id: true },
        },
      },
    })

    let nextCursor: string | null = null
    if (outfits.length > limit) {
      const nextItem = outfits.pop() // Remove the extra item
      nextCursor = nextItem!.id // Use its ID as the cursor
    }

    // Add isSavedByCurrentUser flag
    const outfitsWithSaveStatus = outfits.map(outfit => ({
      ...outfit,
      isSavedByCurrentUser: outfit.savedBy.length > 0,
    }));

    return NextResponse.json({
      outfits: outfitsWithSaveStatus,
      nextCursor,
    })

  } catch (error) {
    // Refined error logging
    console.error('Error fetching public outfits:', error instanceof Error ? error.message : String(error))
    return NextResponse.json(
      { error: 'Failed to fetch public outfits' },
      { status: 500 }
    )
  }
} 