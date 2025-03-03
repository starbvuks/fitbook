import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const updateProfileSchema = z.object({
  name: z.string().nullable(),
  username: z.string().min(3).nullable(),
  bio: z.string().nullable(),
  location: z.string().nullable(),
  website: z.string().url().nullable(),
  instagram: z.string().nullable(),
  pinterest: z.string().nullable(),
  tiktok: z.string().nullable(),
  currency: z.string().optional(),
  language: z.string().optional(),
  emailNotifications: z.boolean().optional(),
  publicProfile: z.boolean().optional(),
  darkMode: z.boolean().optional(),
  image: z.string().nullable(),
})

async function getUserStats(userId: string) {
  try {
    const [
      itemCount,
      outfitCount,
      lookbookCount,
      totalSpent,
      mostExpensiveItem
    ] = await Promise.all([
      prisma.wardrobeItem.count({ where: { userId } }),
      prisma.outfit.count({ where: { userId } }),
      prisma.lookbook.count({ where: { userId } }),
      prisma.wardrobeItem.aggregate({
        where: { userId },
        _sum: { price: true }
      }),
      prisma.wardrobeItem.findFirst({
        where: { userId },
        orderBy: { price: 'desc' },
        select: { price: true }
      })
    ])

    return {
      itemCount,
      outfitCount,
      lookbookCount,
      totalSpent: totalSpent._sum.price || 0,
      mostExpensiveItem: mostExpensiveItem?.price || 0
    }
  } catch (error) {
    console.error('Error getting user stats:', error)
    return {
      itemCount: 0,
      outfitCount: 0,
      lookbookCount: 0,
      totalSpent: 0,
      mostExpensiveItem: 0
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email || !session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized - Invalid session' }, { status: 401 })
    }

    // Find the user profile by ID since we now have it from the session
    const profile = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        image: true,
        bio: true,
        location: true,
        website: true,
        instagram: true,
        pinterest: true,
        tiktok: true,
        currency: true,
        language: true,
        emailNotifications: true,
        publicProfile: true,
        darkMode: true,
      }
    })

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Get user statistics
    const stats = await getUserStats(profile.id)

    return NextResponse.json({ ...profile, stats })
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email || !session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized - Invalid session' }, { status: 401 })
    }

    const body = await request.json()
    if (!body) {
      return NextResponse.json({ error: 'Request body is required' }, { status: 400 })
    }

    const data = updateProfileSchema.parse(body)

    // If username is being updated, check if it's already taken
    if (data.username) {
      const existingUser = await prisma.user.findUnique({
        where: { username: data.username }
      })
      if (existingUser && existingUser.id !== session.user.id) {
        return NextResponse.json(
          { error: 'Username is already taken' },
          { status: 400 }
        )
      }
    }

    // Update profile
    const profile = await prisma.user.update({
      where: { id: session.user.id },
      data: data,
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        image: true,
        bio: true,
        location: true,
        website: true,
        instagram: true,
        pinterest: true,
        tiktok: true,
        currency: true,
        language: true,
        emailNotifications: true,
        publicProfile: true,
        darkMode: true,
      }
    })

    // Get updated stats
    const stats = await getUserStats(profile.id)

    return NextResponse.json({ ...profile, stats })
  } catch (error) {
    console.error('Error updating profile:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update profile', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 