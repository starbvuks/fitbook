import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return new NextResponse(null, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        currency: true
      }
    })

    if (!user) {
      return new NextResponse(null, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('[USER_ME]', error)
    return new NextResponse(null, { status: 500 })
  }
} 