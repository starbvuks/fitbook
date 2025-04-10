import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/outfits/public
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const cursor = searchParams.get('cursor')
    const searchQuery = searchParams.get('query') // Get search query

    // Build the where clause for filtering
    let whereClause: any = {
      isPublic: true
    };

    if (searchQuery) {
      whereClause.OR = [
        { name: { contains: searchQuery, mode: 'insensitive' } }, // Search outfit name
        { user: { name: { contains: searchQuery, mode: 'insensitive' } } }, // Search user name
        { user: { username: { contains: searchQuery, mode: 'insensitive' } } } // Search username
      ];
    }

    // Fetch outfits with filtering, upvote count, and user status
    const outfitsData = await prisma.outfit.findMany({
      where: whereClause,
      take: limit,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: [
        // Primary sort: upvotes descending (calculated later)
        // Secondary sort: creation date descending
        { createdAt: 'desc' } 
      ],
      include: {
        items: { include: { wardrobeItem: { include: { images: true } } } },
        tags: true,
        occasions: true,
        seasons: true,
        user: { select: { id: true, name: true, username: true, image: true } },
        _count: { select: { upvotesReceived: true } },
        upvotesReceived: !userId ? false : { where: { userId }, select: { id: true } },
        savedBy: !userId ? false : { where: { userId }, select: { id: true } }
      }
    })

    // Process outfits to add calculated fields
    const processedOutfits = outfitsData.map(outfit => {
      const { _count, upvotesReceived, savedBy, ...rest } = outfit;
      return {
        ...rest,
        upvoteCount: _count?.upvotesReceived ?? 0,
        hasUpvoted: Array.isArray(upvotesReceived) ? upvotesReceived.length > 0 : false,
        hasSaved: Array.isArray(savedBy) ? savedBy.length > 0 : false
      };
    })
    
    // Sort processed outfits by upvote count (descending)
    processedOutfits.sort((a, b) => b.upvoteCount - a.upvoteCount);

    const nextCursor = outfitsData.length === limit ? outfitsData[outfitsData.length - 1].id : null

    return NextResponse.json({
      outfits: processedOutfits,
      nextCursor
    })
  } catch (error) {
    console.error('Error fetching public outfits:', error)
    return NextResponse.json(
      { error: 'Failed to fetch public outfits' },
      { status: 500 }
    )
  }
} 