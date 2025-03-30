import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const lookbooks = await prisma.lookbook.findMany({
      where: {
        OR: [
          { userId: session.user.id },
          { isPublic: true }
        ]
      },
      include: {
        outfits: {
          include: {
            items: {
              include: {
                wardrobeItem: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(lookbooks)
  } catch (error) {
    console.error('Error fetching lookbooks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch lookbooks' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    if (!body) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const lookbook = await prisma.lookbook.create({
      data: {
        name: body.name,
        description: body.description,
        isPublic: body.isPublic || false,
        userId: session.user.id,
        outfits: {
          connect: (body.outfits || []).map((outfitId: string) => ({ id: outfitId }))
        }
      },
      include: {
        outfits: {
          include: {
            items: {
              include: {
                wardrobeItem: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json(lookbook)
  } catch (error) {
    console.error('Error creating lookbook:', error)
    return NextResponse.json(
      { error: 'Failed to create lookbook' },
      { status: 500 }
    )
  }
} 