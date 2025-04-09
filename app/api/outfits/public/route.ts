import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
// import { Prisma } from '@prisma/client' // Remove general import
// Import specific types needed
import type { 
  Prisma, // Keep Prisma namespace for other potential uses
  OutfitWhereInput, 
  OutfitOrderByWithRelationInput 
} from '@prisma/client';
import type { SeasonName, OccasionName } from '@/app/models/types' // Import filter types

// GET /api/outfits/public
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions) // Get session for current user
  const currentUserId = session?.user?.id // May be undefined if not logged in

  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '20') 
  const cursor = searchParams.get('cursor') as string | undefined
  const search = searchParams.get('search') || ''
  // Get filter params
  const seasons = searchParams.getAll('season') as SeasonName[]
  const occasions = searchParams.getAll('occasion') as OccasionName[]
  const sortBy = searchParams.get('sort') || 'recent' // recent, rating, popular (later)

  // Use the specifically imported type
  const whereClause: OutfitWhereInput = {
    isPublic: true,
    ...(currentUserId && { userId: { not: currentUserId } }), // Exclude own if logged in
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        // Could add user name search here too
        // { user: { name: { contains: search, mode: 'insensitive' } } }
      ],
    }),
    // Add season filter logic
    ...(seasons.length > 0 && {
      seasons: {
        some: { name: { in: seasons } }
      }
    }),
    // Add occasion filter logic
    ...(occasions.length > 0 && {
      occasions: {
        some: { name: { in: occasions } }
      }
    }),
  };

  // Use the specifically imported type
  let orderByClause: OutfitOrderByWithRelationInput | OutfitOrderByWithRelationInput[] = { createdAt: 'desc' }; // Default
  if (sortBy === 'rating') {
    orderByClause = { rating: 'desc' }; // Order by rating descending
  }
  // TODO: Add sorting by popularity (e.g., save count) when possible
  // if (sortBy === 'popular') {
  //   orderByClause = { savedBy: { _count: 'desc' } }; 
  // }

  try {
    const outfits = await prisma.outfit.findMany({
      where: whereClause,
      take: limit,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: orderByClause, // Use dynamic order by
      select: {
        id: true,
        name: true,
        totalCost: true,
        rating: true,
        createdAt: true,
        userId: true,     
        user: { select: { name: true } },
        savedBy: {
          where: { userId: currentUserId ?? undefined }, 
          select: { userId: true } 
        },
        seasons: { select: { name: true }, take: 1 }, // Keep for potential display
        occasions: { select: { name: true }, take: 1 }, // Keep for potential display
      }
    })

    let nextCursor: typeof cursor | null = null
    if (outfits.length === limit) {
      nextCursor = outfits[limit - 1].id
    }

    const transformedOutfits = outfits.map(outfit => ({
      id: outfit.id,
      name: outfit.name,
      createdAt: outfit.createdAt.toISOString(),
      thumbnailUrl: undefined,
      totalCost: outfit.totalCost,
      userId: outfit.userId,
      userName: outfit.user?.name ?? 'Unknown User',
      rating: outfit.rating ?? undefined,
      isSavedByCurrentUser: outfit.savedBy.length > 0,
      firstSeason: outfit.seasons[0]?.name,
      firstOccasion: outfit.occasions[0]?.name,
    }));

    return NextResponse.json({
      outfits: transformedOutfits,
      nextCursor
    });

  } catch (error) {
    // If the error is specifically about thumbnailUrl again after restart, 
    // we might have to temporarily remove it from `select` for debugging.
    console.error('Failed to fetch public outfits:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 