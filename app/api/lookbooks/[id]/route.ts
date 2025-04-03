import { NextResponse } from 'next/server'
import { authenticatedHandler, validateBody } from '@/lib/api-utils'
import { lookbookSchema } from '@/lib/validations'
import { prisma } from '@/lib/prisma'

// Helper function to extract ID from URL
function getIdFromUrl(url: string): string {
  const segments = new URL(url).pathname.split('/')
  return segments[segments.length - 1]
}

// GET /api/lookbooks/[id]
export async function GET(req: Request) {
  return authenticatedHandler(req, async (userId) => {
    const id = getIdFromUrl(req.url)
    
    const lookbook = await prisma.lookbook.findUnique({
      where: {
        id,
        userId,
      },
      include: {
        outfits: {
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
          },
        },
      },
    })

    if (!lookbook) {
      return NextResponse.json({ error: 'Lookbook not found' }, { status: 404 })
    }

    return NextResponse.json(lookbook)
  })
}

// PUT /api/lookbooks/[id]
export async function PUT(req: Request) {
  return authenticatedHandler(req, async (userId) => {
    const id = getIdFromUrl(req.url)
    const data = await validateBody(req, lookbookSchema)

    // First check if the lookbook exists and belongs to the user
    const existingLookbook = await prisma.lookbook.findUnique({
      where: {
        id,
        userId,
      },
    })

    if (!existingLookbook) {
      return NextResponse.json({ error: 'Lookbook not found' }, { status: 404 })
    }

    // Verify all outfits belong to the user
    const outfits = await prisma.outfit.findMany({
      where: {
        id: {
          in: data.outfitIds,
        },
        userId,
      },
      select: {
        id: true,
      },
    })

    if (outfits.length !== data.outfitIds.length) {
      return NextResponse.json(
        { error: 'One or more outfits not found in your collection' },
        { status: 400 }
      )
    }

    // Update the lookbook
    const lookbook = await prisma.lookbook.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        isPublic: data.isPublic,
        outfits: {
          set: data.outfitIds.map(id => ({ id })),
        },
      },
      include: {
        outfits: {
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
          },
        },
      },
    })

    return NextResponse.json(lookbook)
  })
}

// DELETE /api/lookbooks/[id]
export async function DELETE(req: Request) {
  return authenticatedHandler(req, async (userId) => {
    const id = getIdFromUrl(req.url)
    
    // First check if the lookbook exists and belongs to the user
    const lookbook = await prisma.lookbook.findUnique({
      where: {
        id,
        userId,
      },
    })

    if (!lookbook) {
      return NextResponse.json({ error: 'Lookbook not found' }, { status: 404 })
    }

    // Delete the lookbook
    await prisma.lookbook.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  })
} 