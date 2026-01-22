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

  const now = new Date()
  const exerciseTypes = ['pushups', 'situps', 'squats', 'pullups']
  
  // Helper function to get start of week (Sunday)
  const getWeekStart = (date: Date): Date => {
    const weekStart = new Date(date)
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()) // Go to Sunday
    weekStart.setHours(0, 0, 0, 0)
    return weekStart
  }

  // Check if 12-week test data already exists
  const existingExercises = await prisma.exercise.findMany({
    where: {
      userId: user.id,
    },
    orderBy: {
      completedAt: 'desc',
    },
  })

  // Check if we have exercises from 12+ weeks ago (indicating test data exists)
  const hasTestData = existingExercises.some(ex => {
    const twelveWeeksAgo = new Date()
    twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - (12 * 7))
    return new Date(ex.completedAt) < twelveWeeksAgo
  })

  if (!hasTestData) {
    console.log('📅 Creating 12 weeks of exercise data for all exercise types...')
    
    const exercisesToCreate: Array<{
      userId: string
      exerciseType: string
      count: number
      duration: number
      completedAt: Date
    }> = []

    // Exercise-specific configurations
    const exerciseConfig = {
      pushups: {
        sessionsPerWeek: [2, 3, 2, 3, 2, 3, 2, 3, 2, 3, 2, 3], // Varying sessions
        repsPerSession: [
          [15, 20], [12, 15, 18], [18, 22], [15, 18, 20], [20, 25],
          [15, 20, 22], [22, 28], [18, 22, 25], [25, 30], [20, 25, 28],
          [28, 35], [25, 30, 35]
        ],
        secondsPerRep: 2.5,
      },
      situps: {
        sessionsPerWeek: [2, 2, 3, 2, 3, 2, 3, 2, 3, 2, 3, 2],
        repsPerSession: [
          [20, 25], [25, 30], [20, 25, 30], [30, 35], [25, 30, 35],
          [35, 40], [30, 35, 40], [40, 45], [35, 40, 45], [45, 50],
          [40, 45, 50], [50, 55]
        ],
        secondsPerRep: 2.5,
      },
      squats: {
        sessionsPerWeek: [2, 3, 2, 3, 2, 3, 2, 3, 2, 3, 2, 3],
        repsPerSession: [
          [15, 20], [12, 15, 18], [18, 22], [15, 18, 20], [20, 25],
          [15, 20, 22], [22, 28], [18, 22, 25], [25, 30], [20, 25, 28],
          [28, 35], [25, 30, 35]
        ],
        secondsPerRep: 3.5,
      },
      pullups: {
        sessionsPerWeek: [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2], // Fewer sessions (harder exercise)
        repsPerSession: [
          [5, 8], [6, 8], [5, 8, 10], [8, 10], [6, 10, 12],
          [10, 12], [8, 12, 15], [12, 15], [10, 15, 18], [15, 18],
          [12, 18, 20], [18, 20]
        ],
        secondsPerRep: 4.0,
      },
    }

    // Create exercises for all 12 weeks and all exercise types
    for (let weekNum = 1; weekNum <= 12; weekNum++) {
      const weeksBack = 12 - weekNum
      const weekDate = new Date(now)
      weekDate.setDate(weekDate.getDate() - (weeksBack * 7))
      const weekStart = getWeekStart(weekDate)

      // Create exercises for each type
      for (const exerciseType of exerciseTypes) {
        const config = exerciseConfig[exerciseType as keyof typeof exerciseConfig]
        const sessionsInWeek = config.sessionsPerWeek[weekNum - 1]
        const repsForWeek = config.repsPerSession[weekNum - 1]

        // Skip some weeks randomly to make it more realistic (70% completion rate)
        const shouldSkip = Math.random() > 0.7
        if (shouldSkip && weekNum > 2) continue // Don't skip first 2 weeks

        for (let session = 0; session < sessionsInWeek; session++) {
          const sessionDate = new Date(weekStart)
          // Distribute sessions across the week (Monday, Wednesday, Friday pattern)
          if (sessionsInWeek === 2) {
            sessionDate.setDate(sessionDate.getDate() + (session === 0 ? 1 : 4)) // Monday and Friday
          } else {
            sessionDate.setDate(sessionDate.getDate() + (session * 2 + 1)) // Monday, Wednesday, Friday
          }
          
          // Vary the time of day (morning, afternoon, evening)
          const hour = 8 + (session * 4) + Math.floor(Math.random() * 2)
          sessionDate.setHours(hour, 30 + Math.floor(Math.random() * 30), 0, 0)

          const count = repsForWeek[session]
          if (count > 0) {
            exercisesToCreate.push({
              userId: user.id,
              exerciseType,
              count,
              duration: Math.round(count * config.secondsPerRep * 1000),
              completedAt: sessionDate,
            })
          }
        }
      }
    }

    // Create all exercises in batches for better performance
    const batchSize = 50
    for (let i = 0; i < exercisesToCreate.length; i += batchSize) {
      const batch = exercisesToCreate.slice(i, i + batchSize)
      await prisma.exercise.createMany({
        data: batch,
      })
    }

    // Count exercises by type
    const countsByType = exerciseTypes.reduce((acc, type) => {
      acc[type] = exercisesToCreate.filter(ex => ex.exerciseType === type).length
      return acc
    }, {} as Record<string, number>)

    console.log(`✅ Created ${exercisesToCreate.length} workout sessions across 12 weeks`)
    console.log('   Exercise breakdown:')
    for (const [type, count] of Object.entries(countsByType)) {
      console.log(`   - ${type}: ${count} sessions`)
    }
  } else {
    console.log('ℹ️  12-week test data already exists')
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
