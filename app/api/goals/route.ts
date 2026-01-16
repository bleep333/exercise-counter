import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const archived = searchParams.get('archived')

    const whereClause: any = { userId: session.user.id }
    if (archived !== null) {
      whereClause.archived = archived === 'true'
    }

    const goals = await prisma.goal.findMany({
      where: whereClause,
      orderBy: [
        { exerciseType: 'asc' },
        { period: 'asc' },
      ],
    })

    return NextResponse.json({ goals })
  } catch (error) {
    console.error('Error fetching goals:', error)
    return NextResponse.json(
      { error: 'Failed to fetch goals' },
      { status: 500 }
    )
  }
}

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
    const { exerciseType, targetCount, period } = body

    if (!exerciseType || targetCount === undefined || !period) {
      return NextResponse.json(
        { error: 'Missing required fields: exerciseType, targetCount, period' },
        { status: 400 }
      )
    }

    if (!['day', 'week', 'month'].includes(period)) {
      return NextResponse.json(
        { error: 'Period must be "day", "week", or "month"' },
        { status: 400 }
      )
    }

    if (targetCount <= 0) {
      return NextResponse.json(
        { error: 'Target count must be greater than 0' },
        { status: 400 }
      )
    }

    // Check if goal already exists for this user, exercise type, and period
    const existingGoal = await prisma.goal.findUnique({
      where: {
        userId_exerciseType_period: {
          userId: session.user.id,
          exerciseType,
          period,
        },
      },
    })

    if (existingGoal) {
      // Update existing goal
      const goal = await prisma.goal.update({
        where: { id: existingGoal.id },
        data: { targetCount },
      })
      return NextResponse.json({ goal })
    }

    // Create new goal
    const goal = await prisma.goal.create({
      data: {
        userId: session.user.id,
        exerciseType,
        targetCount,
        period,
      },
    })

    return NextResponse.json({ goal })
  } catch (error) {
    console.error('Error creating/updating goal:', error)
    return NextResponse.json(
      { error: 'Failed to create/update goal' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const goalId = searchParams.get('id')

    if (!goalId) {
      return NextResponse.json(
        { error: 'Goal ID is required' },
        { status: 400 }
      )
    }

    // Verify the goal belongs to the user
    const goal = await prisma.goal.findUnique({
      where: { id: goalId },
    })

    if (!goal) {
      return NextResponse.json(
        { error: 'Goal not found' },
        { status: 404 }
      )
    }

    if (goal.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    await prisma.goal.delete({
      where: { id: goalId },
    })

    return NextResponse.json({ message: 'Goal deleted successfully' })
  } catch (error) {
    console.error('Error deleting goal:', error)
    return NextResponse.json(
      { error: 'Failed to delete goal' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const goalId = searchParams.get('id')

    if (!goalId) {
      return NextResponse.json(
        { error: 'Goal ID is required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { archived } = body

    if (archived === undefined) {
      return NextResponse.json(
        { error: 'archived field is required' },
        { status: 400 }
      )
    }

    // Verify the goal belongs to the user
    const goal = await prisma.goal.findUnique({
      where: { id: goalId },
    })

    if (!goal) {
      return NextResponse.json(
        { error: 'Goal not found' },
        { status: 404 }
      )
    }

    if (goal.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const updatedGoal = await prisma.goal.update({
      where: { id: goalId },
      data: { archived: archived === true },
    })

    return NextResponse.json({ goal: updatedGoal })
  } catch (error) {
    console.error('Error archiving/unarchiving goal:', error)
    return NextResponse.json(
      { error: 'Failed to update goal' },
      { status: 500 }
    )
  }
}
