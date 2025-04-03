import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { ZodError, ZodSchema } from 'zod'
import { prisma } from './prisma'

export async function authenticatedHandler(
  req: Request,
  handler: (userId: string) => Promise<Response>
): Promise<Response> {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return await handler(session.user.id)
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

export async function validateBody<T>(
  req: Request,
  schema: ZodSchema<T>
): Promise<T> {
  try {
    const body = await req.json()
    return schema.parse(body)
  } catch (error) {
    if (error instanceof ZodError) {
      throw new Error(`Validation error: ${error.errors.map(e => e.message).join(', ')}`)
    }
    throw error
  }
} 