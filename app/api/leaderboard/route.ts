import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30days' // 'today' or '30days'
    const exerciseType = searchParams.get('exerciseType') || 'pushups'

    const now = new Date()
    const startDate = new Date()

    if (period === 'today') {
      startDate.setHours(0, 0, 0, 0)
    } else {
      startDate.setDate(startDate.getDate() - 30)
      startDate.setHours(0, 0, 0, 0)
    }

    // Get exercises within the time period, grouped by user
    const exercises = await prisma.exercise.findMany({
      where: {
        exerciseType,
        completedAt: {
          gte: startDate,
          lte: now,
        },
        userId: { not: null }, // Only logged-in users
      },
      include: {
        user: {
          select: {
            profileName: true,
          },
        },
      },
    })

    // Group by user and sum counts
    const userStats = new Map<string, { profileName: string | null; totalCount: number }>()

    exercises.forEach((exercise) => {
      if (!exercise.userId || !exercise.user) return

      const existing = userStats.get(exercise.userId) || {
        profileName: exercise.user.profileName,
        totalCount: 0,
      }

      userStats.set(exercise.userId, {
        profileName: existing.profileName,
        totalCount: existing.totalCount + exercise.count,
      })
    })

    // Convert to array and sort by total count (descending)
    const leaderboard = Array.from(userStats.values())
      .filter((stat) => stat.profileName !== null) // Only show users with profile names
      .sort((a, b) => b.totalCount - a.totalCount)
      .slice(0, 100) // Top 100

    return NextResponse.json({ leaderboard, period, exerciseType })
  } catch (error) {
    console.error('Error fetching leaderboard:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    )
  }
}
