import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { exercises } = body

    if (!exercises || !Array.isArray(exercises)) {
      return NextResponse.json(
        { error: 'Exercises array is required' },
        { status: 400 }
      )
    }

    // Migrate guest exercises to user account
    const migratedExercises = await Promise.all(
      exercises.map((exercise: any) =>
        prisma.exercise.create({
          data: {
            userId: session.user.id,
            exerciseType: exercise.exerciseType,
            count: exercise.count,
            duration: exercise.duration,
            completedAt: new Date(exercise.completedAt),
          },
        })
      )
    )

    return NextResponse.json({
      message: 'Exercises migrated successfully',
      count: migratedExercises.length,
    })
  } catch (error) {
    console.error('Error migrating guest exercises:', error)
    return NextResponse.json(
      { error: 'Failed to migrate exercises' },
      { status: 500 }
    )
  }
}
