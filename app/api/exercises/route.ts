import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id

    // If user is logged in, fetch their exercises
    // If not, return empty array (guest exercises are handled client-side)
    const exercises = userId
      ? await prisma.exercise.findMany({
          where: { userId },
          orderBy: { completedAt: 'desc' },
        })
      : []

    return NextResponse.json({ exercises })
  } catch (error) {
    console.error('Error fetching exercises:', error)
    return NextResponse.json(
      { error: 'Failed to fetch exercises' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const body = await request.json()
    const { exerciseType, count, duration, completedAt } = body

    if (!exerciseType || count === undefined || duration === undefined || !completedAt) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // If user is logged in, save to database
    // If not, this should not be called (client should use localStorage)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in to save exercises.' },
        { status: 401 }
      )
    }

    const exercise = await prisma.exercise.create({
      data: {
        userId: session.user.id,
        exerciseType,
        count,
        duration,
        completedAt: new Date(completedAt),
      },
    })

    return NextResponse.json({
      id: exercise.id,
      exerciseType: exercise.exerciseType,
      count: exercise.count,
      duration: exercise.duration,
      completedAt: exercise.completedAt.toISOString(),
    })
  } catch (error) {
    console.error('Error saving exercise:', error)
    return NextResponse.json(
      { error: 'Failed to save exercise' },
      { status: 500 }
    )
  }
}
