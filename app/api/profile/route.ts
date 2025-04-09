import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import type { UserProfile } from '@/app/models/types'

const updateProfileSchema = z.object({
  name: z.string().nullable(),
  username: z.string().nullable(),
  bio: z.string().nullable(),
  location: z.string().nullable(),
  website: z.string().url().nullable().or(z.literal('')).transform(v => v || null),
  instagram: z.string().nullable().or(z.literal('')).transform(v => v || null),
  pinterest: z.string().nullable().or(z.literal('')).transform(v => v || null),
  tiktok: z.string().nullable().or(z.literal('')).transform(v => v || null),
  currency: z.enum(['USD', 'EUR', 'GBP', 'JPY', 'INR', 'CAD', 'AUD']),
  language: z.string(),
  emailNotifications: z.boolean(),
  publicProfile: z.boolean(),
  image: z.string().nullable()
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
        where: { userId, isOwned: true },
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

// Mock user profile for demonstration
const mockProfile: UserProfile = {
  id: 'user1',
  name: 'Demo User',
  email: 'demo@example.com',
  currency: 'INR',
  language: 'en',
  darkMode: false,
  emailNotifications: true,
  publicProfile: true,
  totalSpent: 2500,
  featuredOutfits: [],
  stats: {
    itemCount: 12,
    outfitCount: 5,
    lookbookCount: 2,
    totalSpent: 2500,
    mostExpensiveItem: 500
  }
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email || !session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const profile = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
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

    const stats = await getUserStats(profile.id)

    return NextResponse.json({
      ...profile,
      stats,
      featuredOutfits: [], // TODO: Implement featured outfits
      totalSpent: stats.totalSpent
    })
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email || !session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    console.log('Received update data:', body) // Debug log
    
    const data = updateProfileSchema.parse(body)
    console.log('Parsed data:', data) // Debug log

    const profile = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: data.name,
        username: data.username,
        bio: data.bio,
        location: data.location,
        website: data.website,
        instagram: data.instagram,
        pinterest: data.pinterest,
        tiktok: data.tiktok,
        currency: data.currency,
        language: data.language,
        emailNotifications: data.emailNotifications,
        publicProfile: data.publicProfile,
        image: data.image
      },
      select: {
        id: true,
        name: true,
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
        publicProfile: true
      }
    })

    const stats = await getUserStats(profile.id)

    return NextResponse.json({
      ...profile,
      stats,
      featuredOutfits: [],
      totalSpent: stats.totalSpent
    })
  } catch (error) {
    console.error('Error updating profile:', error)
    
    if (error instanceof z.ZodError) {
      console.log('Validation errors:', error.errors) // Debug log
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
} 