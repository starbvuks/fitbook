import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/outfits/toggle-upvote
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

    // Check if outfit exists and is public
    const outfit = await prisma.outfit.findUnique({
      where: { id: outfitId },
      select: { id: true, isPublic: true }
    })

    if (!outfit) {
      return NextResponse.json(
        { error: 'Outfit not found' },
        { status: 404 }
      )
    }

    if (!outfit.isPublic) {
      return NextResponse.json(
        { error: 'Cannot upvote a private outfit' },
        { status: 403 }
      )
    }

    // Check if the user has already upvoted this outfit
    const existingUpvote = await prisma.upvote.findUnique({
      where: {
        userId_outfitId: { userId, outfitId }
      }
    })

    let newUpvoteCount: number
    let upvoted: boolean

    if (existingUpvote) {
      // User has upvoted, so remove the upvote (toggle off)
      await prisma.upvote.delete({
        where: {
          userId_outfitId: { userId, outfitId }
        }
      })
      upvoted = false
    } else {
      // User has not upvoted, so add the upvote (toggle on)
      await prisma.upvote.create({
        data: {
          userId,
          outfitId,
        }
      })
      upvoted = true
    }

    // Get the new total upvote count for the outfit
    const countResult = await prisma.upvote.count({
      where: { outfitId }
    })
    newUpvoteCount = countResult

    return NextResponse.json({ 
      success: true,
      upvoted: upvoted,
      newCount: newUpvoteCount
    })

  } catch (error) {
    console.error('Error toggling outfit upvote:', error)
    return NextResponse.json(
      { error: 'Failed to toggle upvote' },
      { status: 500 }
    )
  }
} 