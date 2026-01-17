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
    const { exerciseType, targetCount, period, startDate, confirmReplace, goalId } = body

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

    // Check for existing ACTIVE goals with the same exerciseType and period
    const existingActiveGoals = await prisma.goal.findMany({
      where: {
        userId: session.user.id,
        exerciseType,
        period,
        archived: false, // Only check active goals
      },
    })

    // Parse startDate if provided, otherwise use current date
    let parsedStartDate = new Date()
    parsedStartDate.setHours(0, 0, 0, 0) // Normalize to start of day
    
    if (startDate) {
      // Parse the date string (expected format: YYYY-MM-DD)
      const dateParts = startDate.split('T')[0].split('-')
      if (dateParts.length === 3) {
        const year = parseInt(dateParts[0], 10)
        const month = parseInt(dateParts[1], 10) - 1 // Month is 0-indexed
        const day = parseInt(dateParts[2], 10)
        
        if (isNaN(year) || isNaN(month) || isNaN(day)) {
          return NextResponse.json(
            { error: 'Invalid startDate format. Expected YYYY-MM-DD' },
            { status: 400 }
          )
        }
        
        parsedStartDate = new Date(year, month, day)
        parsedStartDate.setHours(0, 0, 0, 0) // Normalize to start of day
        
        if (isNaN(parsedStartDate.getTime())) {
          return NextResponse.json(
            { error: 'Invalid startDate: date is out of range' },
            { status: 400 }
          )
        }
      } else {
        // Fallback to Date constructor if format is different
        parsedStartDate = new Date(startDate)
        if (isNaN(parsedStartDate.getTime())) {
          return NextResponse.json(
            { error: 'Invalid startDate format. Expected YYYY-MM-DD' },
            { status: 400 }
          )
        }
        parsedStartDate.setHours(0, 0, 0, 0) // Normalize to start of day
      }
    }

    // If active goals exist and user hasn't confirmed replacement, return error
    if (existingActiveGoals.length > 0 && !confirmReplace) {
      const existingGoal = existingActiveGoals[0]
      const periodLabel = period === 'day' ? 'Daily' : period === 'week' ? 'Weekly' : 'Monthly'
      const exerciseLabel = exerciseType.charAt(0).toUpperCase() + exerciseType.slice(1)
      
      return NextResponse.json(
        { 
          error: 'ACTIVE_GOAL_EXISTS',
          existingGoal: {
            id: existingGoal.id,
            targetCount: existingGoal.targetCount,
            periodLabel,
            exerciseLabel,
          }
        },
        { status: 409 } // Conflict status code
      )
    }

    // If goalId is provided, we're editing an existing goal
    if (goalId) {
      // Verify the goal belongs to the user
      const existingGoal = await prisma.goal.findUnique({
        where: { id: goalId },
      })

      if (!existingGoal) {
        return NextResponse.json(
          { error: 'Goal not found' },
          { status: 404 }
        )
      }

      if (existingGoal.userId !== session.user.id) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 403 }
        )
      }

      // Update the existing goal
      const goal = await prisma.goal.update({
        where: { id: goalId },
        data: {
          targetCount,
          startDate: parsedStartDate,
        },
      })

      return NextResponse.json({ goal })
    }

    // If user confirmed replacement, archive all existing active goals and create new one
    if (confirmReplace && existingActiveGoals.length > 0) {
      // Archive all existing active goals
      await prisma.goal.updateMany({
        where: {
          userId: session.user.id,
          exerciseType,
          period,
          archived: false,
        },
        data: {
          archived: true,
        },
      })

      // Create new goal
      const goal = await prisma.goal.create({
        data: {
          userId: session.user.id,
          exerciseType,
          targetCount,
          period,
          startDate: parsedStartDate,
          archived: false,
        },
      })

      return NextResponse.json({ goal })
    }

    // Create new goal (no existing goal found)
    const goal = await prisma.goal.create({
      data: {
        userId: session.user.id,
        exerciseType,
        targetCount,
        period,
        startDate: parsedStartDate,
        archived: false,
      },
    })

    return NextResponse.json({ goal })
  } catch (error) {
    console.error('Error creating/updating goal:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to create/update goal'
    return NextResponse.json(
      { error: errorMessage },
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
