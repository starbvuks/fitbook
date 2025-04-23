import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import type { UserProfile } from '@/app/models/types'

const updateProfileSchema = z.object({
  name: z.string().nullable().optional(),
  username: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  website: z.string().url().nullable().or(z.literal('')).transform(v => v || null).optional(),
  instagram: z.string().nullable().or(z.literal('')).transform(v => v || null).optional(),
  pinterest: z.string().nullable().or(z.literal('')).transform(v => v || null).optional(),
  tiktok: z.string().nullable().or(z.literal('')).transform(v => v || null).optional(),
  currency: z.enum(['USD', 'EUR', 'GBP', 'JPY', 'INR', 'CAD', 'AUD']).optional(),
  language: z.string().optional(),
  emailNotifications: z.boolean().optional(),
  publicProfile: z.boolean().optional(),
  image: z.string().nullable().optional(),
  darkMode: z.boolean().optional()
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

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return new Response('Unauthorized', { status: 401 })
    }

    const data = await req.json()
    const validatedData = updateProfileSchema.parse(data)

    const user = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        name: validatedData.name,
        username: validatedData.username,
        bio: validatedData.bio,
        location: validatedData.location,
        website: validatedData.website,
        instagram: validatedData.instagram,
        pinterest: validatedData.pinterest,
        tiktok: validatedData.tiktok,
        currency: validatedData.currency,
        language: validatedData.language,
        emailNotifications: validatedData.emailNotifications,
        publicProfile: validatedData.publicProfile,
        darkMode: validatedData.darkMode
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
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
        image: true,
        totalSpent: true
      }
    })

    return Response.json(user)
  } catch (error) {
    console.error('Error updating profile:', error)
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({ error: error.errors }), { status: 400 })
    }
    return new Response('Error updating profile', { status: 500 })
  }
} 