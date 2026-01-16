import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'
import * as dotenv from 'dotenv'

dotenv.config()

const pool = process.env.DATABASE_URL ? new Pool({ connectionString: process.env.DATABASE_URL }) : null
const adapter = pool ? new PrismaPg(pool) : undefined

const prisma = new PrismaClient({
  ...(adapter && { adapter }),
  log: ['error'],
})

async function main() {
  console.log('🌱 Starting seed...')

  // Create dummy user
  const email = 'user@counter.com'
  const password = 'user123'
  const name = 'Test User'
  const profileName = 'bleep'

  // Check if user already exists
  let user = await prisma.user.findUnique({
    where: { email },
  })

  if (!user) {
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        profileName,
      },
    })
    console.log('✅ Created dummy user:', email)
    console.log('✅ Profile name set to:', profileName)
  } else {
    console.log('ℹ️  User already exists:', email)
    
    // Update profile name if not set
    if (!user.profileName) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { profileName },
      })
      console.log('✅ Profile name set to:', profileName)
    } else {
      console.log('ℹ️  Profile name already set:', user.profileName)
    }
  }

  // Create weekly pushup goal (40 pushups per week) if it doesn't exist
  const now = new Date()
  const existingGoal = await prisma.goal.findUnique({
    where: {
      userId_exerciseType_period: {
        userId: user.id,
        exerciseType: 'pushups',
        period: 'week',
      },
    },
  })

  if (!existingGoal) {
    const goal = await prisma.goal.create({
      data: {
        userId: user.id,
        exerciseType: 'pushups',
        targetCount: 40,
        period: 'week',
      },
    })
    console.log('✅ Created weekly pushup goal: 40 pushups per week')
  } else {
    console.log('ℹ️  Weekly pushup goal already exists')
  }

  // Check if 8-week test data already exists
  const existingExercises = await prisma.exercise.findMany({
    where: {
      userId: user.id,
      exerciseType: 'pushups',
    },
    orderBy: {
      completedAt: 'desc',
    },
  })

  // Check if we have exercises from 8+ weeks ago (indicating test data exists)
  const hasTestData = existingExercises.some(ex => {
    const eightWeeksAgo = new Date()
    eightWeeksAgo.setDate(eightWeeksAgo.getDate() - (8 * 7))
    return new Date(ex.completedAt) < eightWeeksAgo
  })

  if (!hasTestData) {
    console.log('📅 Creating 8 weeks of pushup test data...')
    
    const exercisesToCreate: Array<{
      userId: string
      exerciseType: string
      count: number
      duration: number
      completedAt: Date
    }> = []

    // Helper function to get start of week (Sunday)
    const getWeekStart = (date: Date): Date => {
      const weekStart = new Date(date)
      weekStart.setDate(weekStart.getDate() - weekStart.getDay()) // Go to Sunday
      weekStart.setHours(0, 0, 0, 0)
      return weekStart
    }

    // Create exercises for 8 weeks (going backwards from current week)
    // Week 1 (8 weeks ago): Complete ✓
    // Week 2 (7 weeks ago): Skip ✗
    // Week 3 (6 weeks ago): Skip ✗
    // Week 4 (5 weeks ago): Complete ✓
    // Week 5 (4 weeks ago): Complete ✓
    // Week 6 (3 weeks ago): Skip ✗
    // Week 7 (2 weeks ago): Complete ✓
    // Week 8 (1 week ago / current week): Complete ✓

    const completedWeeks = [1, 4, 5, 7, 8] // Weeks to complete (1-indexed from 8 weeks ago)

    for (let weekNum = 1; weekNum <= 8; weekNum++) {
      if (completedWeeks.includes(weekNum)) {
        // Calculate the start of this week (going back from now)
        const weeksBack = 8 - weekNum
        const weekDate = new Date(now)
        weekDate.setDate(weekDate.getDate() - (weeksBack * 7))
        const weekStart = getWeekStart(weekDate)
        
        // Add 2-3 exercise sessions within this week to total 40+ pushups
        // Distribute them across the week (e.g., Monday, Wednesday, Friday)
        const sessionsInWeek = weekNum === 8 ? 2 : 3 // Current week has 2 sessions, others have 3
        
        for (let session = 0; session < sessionsInWeek; session++) {
          const sessionDate = new Date(weekStart)
          // Monday (1), Wednesday (3), Friday (5) for most weeks
          // For current week, use more recent days
          if (weekNum === 8) {
            // Current week: use recent days
            sessionDate.setDate(sessionDate.getDate() + (session === 0 ? 1 : 4)) // Monday and Friday
          } else {
            sessionDate.setDate(sessionDate.getDate() + (session * 2 + 1)) // Monday, Wednesday, Friday
          }
          sessionDate.setHours(10 + session, 30, 0, 0) // Different times throughout the day

          // Each session contributes to the 40+ total
          // Week 1: 15 + 15 + 15 = 45
          // Week 4: 12 + 14 + 14 = 40
          // Week 5: 13 + 13 + 15 = 41
          // Week 7: 14 + 14 + 12 = 40
          // Week 8: 20 + 25 = 45
          const counts = [
            [15, 15, 15], // Week 1
            [0, 0, 0],     // Week 2 (skip)
            [0, 0, 0],     // Week 3 (skip)
            [12, 14, 14], // Week 4
            [13, 13, 15], // Week 5
            [0, 0, 0],     // Week 6 (skip)
            [14, 14, 12], // Week 7
            [20, 25, 0],  // Week 8 (only 2 sessions)
          ]

          const count = counts[weekNum - 1][session]
          if (count > 0) {
            exercisesToCreate.push({
              userId: user.id,
              exerciseType: 'pushups',
              count,
              duration: count * 3000, // ~3 seconds per pushup
              completedAt: sessionDate,
            })
          }
        }
      }
    }

    // Create all exercises
    for (const exerciseData of exercisesToCreate) {
      await prisma.exercise.create({
        data: exerciseData,
      })
    }

    console.log(`✅ Created ${exercisesToCreate.length} workout sessions across 5 completed weeks`)
    console.log('   Week 1: ✓ (45 pushups)')
    console.log('   Week 2: ✗ (skipped)')
    console.log('   Week 3: ✗ (skipped)')
    console.log('   Week 4: ✓ (40 pushups)')
    console.log('   Week 5: ✓ (41 pushups)')
    console.log('   Week 6: ✗ (skipped)')
    console.log('   Week 7: ✓ (40 pushups)')
    console.log('   Week 8: ✓ (45 pushups)')
  } else {
    console.log('ℹ️  8-week test data already exists')
  }

  console.log('🎉 Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    if (pool) {
      await pool.end()
    }
  })
