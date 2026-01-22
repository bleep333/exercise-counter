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

// Helper function to get start of week (Sunday)
const getWeekStart = (date: Date): Date => {
  const weekStart = new Date(date)
  weekStart.setDate(weekStart.getDate() - weekStart.getDay()) // Go to Sunday
  weekStart.setHours(0, 0, 0, 0)
  return weekStart
}

// Helper function to create exercise history for a user
async function createExerciseHistory(
  userId: string,
  weeks: number,
  exerciseTypes: string[],
  now: Date
) {
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
      sessionsPerWeek: [2, 3, 2, 3, 2, 3, 2, 3, 2, 3, 2, 3, 2, 3, 2, 3],
      repsPerSession: [
        [15, 20], [12, 15, 18], [18, 22], [15, 18, 20], [20, 25],
        [15, 20, 22], [22, 28], [18, 22, 25], [25, 30], [20, 25, 28],
        [28, 35], [25, 30, 35], [30, 35, 40], [35, 40], [30, 40, 45], [40, 45]
      ],
      secondsPerRep: 2.5,
    },
    situps: {
      sessionsPerWeek: [2, 2, 3, 2, 3, 2, 3, 2, 3, 2, 3, 2, 3, 2, 3, 2],
      repsPerSession: [
        [20, 25], [25, 30], [20, 25, 30], [30, 35], [25, 30, 35],
        [35, 40], [30, 35, 40], [40, 45], [35, 40, 45], [45, 50],
        [40, 45, 50], [50, 55], [45, 50, 55], [50, 60], [55, 60], [60, 65]
      ],
      secondsPerRep: 2.5,
    },
    squats: {
      sessionsPerWeek: [2, 3, 2, 3, 2, 3, 2, 3, 2, 3, 2, 3, 2, 3, 2, 3],
      repsPerSession: [
        [15, 20], [12, 15, 18], [18, 22], [15, 18, 20], [20, 25],
        [15, 20, 22], [22, 28], [18, 22, 25], [25, 30], [20, 25, 28],
        [28, 35], [25, 30, 35], [30, 35, 40], [35, 40], [30, 40, 45], [40, 45]
      ],
      secondsPerRep: 3.5,
    },
    pullups: {
      sessionsPerWeek: [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      repsPerSession: [
        [5, 8], [6, 8], [5, 8, 10], [8, 10], [6, 10, 12],
        [10, 12], [8, 12, 15], [12, 15], [10, 15, 18], [15, 18],
        [12, 18, 20], [18, 20], [15, 20, 22], [20, 22], [18, 22, 25], [22, 25]
      ],
      secondsPerRep: 4.0,
    },
  }

  // Create exercises for specified weeks
  for (let weekNum = 1; weekNum <= weeks; weekNum++) {
    const weeksBack = weeks - weekNum
    const weekDate = new Date(now)
    weekDate.setDate(weekDate.getDate() - (weeksBack * 7))
    const weekStart = getWeekStart(weekDate)

    // Create exercises for each type
    for (const exerciseType of exerciseTypes) {
      const config = exerciseConfig[exerciseType as keyof typeof exerciseConfig]
      const sessionsInWeek = config.sessionsPerWeek[weekNum - 1] || config.sessionsPerWeek[config.sessionsPerWeek.length - 1]
      const repsForWeek = config.repsPerSession[weekNum - 1] || config.repsPerSession[config.repsPerSession.length - 1]

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

        const count = repsForWeek[session] || repsForWeek[0]
        if (count > 0) {
          exercisesToCreate.push({
            userId,
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
  if (exercisesToCreate.length > 0) {
    const batchSize = 50
    for (let i = 0; i < exercisesToCreate.length; i += batchSize) {
      const batch = exercisesToCreate.slice(i, i + batchSize)
      await prisma.exercise.createMany({
        data: batch,
      })
    }
  }

  return exercisesToCreate.length
}

async function main() {
  console.log('🌱 Starting seed...')

  const now = new Date()
  const exerciseTypes = ['pushups', 'situps', 'squats', 'pullups']
  const password = 'user123'
  const hashedPassword = await bcrypt.hash(password, 10)

  // Create or update first user
  const email1 = 'user@counter.com'
  const name1 = 'Test User'
  const profileName1 = 'bleep'

  let user1 = await prisma.user.findUnique({
    where: { email: email1 },
  })

  if (!user1) {
    user1 = await prisma.user.create({
      data: {
        email: email1,
        password: hashedPassword,
        name: name1,
        profileName: profileName1,
      },
    })
    console.log('✅ Created dummy user:', email1)
    console.log('✅ Profile name set to:', profileName1)
  } else {
    console.log('ℹ️  User already exists:', email1)
    
    if (!user1.profileName) {
      user1 = await prisma.user.update({
        where: { id: user1.id },
        data: { profileName: profileName1 },
      })
      console.log('✅ Profile name set to:', profileName1)
    } else {
      console.log('ℹ️  Profile name already set:', user1.profileName)
    }
  }

  // Check if 12-week test data already exists for user1
  const existingExercises = await prisma.exercise.findMany({
    where: {
      userId: user1.id,
    },
    orderBy: {
      completedAt: 'desc',
    },
  })

  const hasTestData = existingExercises.some(ex => {
    const twelveWeeksAgo = new Date()
    twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - (12 * 7))
    return new Date(ex.completedAt) < twelveWeeksAgo
  })

  if (!hasTestData) {
    console.log('📅 Creating 12 weeks of exercise data for user1...')
    const count = await createExerciseHistory(user1.id, 12, exerciseTypes, now)
    console.log(`✅ Created ${count} workout sessions for ${email1}`)
  } else {
    console.log('ℹ️  12-week test data already exists for user1')
  }

  // Create additional users
  const newUsers = [
    { email: 'user2@counter.com', name: 'User Two', profileName: 'FitnessFan', weight: Math.floor(Math.random() * 71) + 50 }, // 50-120
    { email: 'user3@counter.com', name: 'User Three', profileName: 'WorkoutWarrior', weight: Math.floor(Math.random() * 71) + 50 },
    { email: 'user4@counter.com', name: 'User Four', profileName: 'ExerciseElite', weight: Math.floor(Math.random() * 71) + 50 },
    { email: 'user5@counter.com', name: 'User Five', profileName: 'StrengthSeeker', weight: Math.floor(Math.random() * 71) + 50 },
    { email: 'user6@counter.com', name: 'User Six', profileName: 'ActiveAthlete', weight: Math.floor(Math.random() * 71) + 50 },
    { email: 'user7@counter.com', name: 'User Seven', profileName: 'PowerPlayer', weight: Math.floor(Math.random() * 71) + 50 },
    { email: 'user8@counter.com', name: 'User Eight', profileName: 'FitFighter', weight: Math.floor(Math.random() * 71) + 50 },
    { email: 'user9@counter.com', name: 'User Nine', profileName: 'MuscleMaster', weight: Math.floor(Math.random() * 71) + 50 },
    { email: 'user10@counter.com', name: 'User Ten', profileName: 'EnduranceExpert', weight: Math.floor(Math.random() * 71) + 50 },
  ]

  for (const userData of newUsers) {
    let user = await prisma.user.findUnique({
      where: { email: userData.email },
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: userData.email,
          password: hashedPassword,
          name: userData.name,
          profileName: userData.profileName,
          weight: userData.weight,
          leaderboardVisible: true,
        },
      })
      console.log(`✅ Created user: ${userData.email}`)
      console.log(`   Profile name: ${userData.profileName}, Weight: ${userData.weight}kg`)
    } else {
      console.log(`ℹ️  User already exists: ${userData.email}`)
      
      // Update fields if needed
      const updateData: any = {}
      if (!user.profileName) updateData.profileName = userData.profileName
      if (!user.weight) updateData.weight = userData.weight
      if (user.leaderboardVisible !== true) updateData.leaderboardVisible = true

      if (Object.keys(updateData).length > 0) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: updateData,
        })
        console.log(`✅ Updated user: ${userData.email}`)
      }
    }

    // Check if exercise data exists (check for exercises from 3+ weeks ago)
    const userExercises = await prisma.exercise.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        completedAt: 'desc',
      },
      take: 1,
    })

    const hasHistory = userExercises.length > 0 && userExercises.some(ex => {
      const threeWeeksAgo = new Date()
      threeWeeksAgo.setDate(threeWeeksAgo.getDate() - (3 * 7))
      return new Date(ex.completedAt) < threeWeeksAgo
    })

    if (!hasHistory) {
      // Create 3-4 weeks of random exercise history
      const weeks = Math.floor(Math.random() * 2) + 3 // 3-4 weeks
      console.log(`📅 Creating ${weeks} weeks of exercise data for ${userData.email}...`)
      const count = await createExerciseHistory(user.id, weeks, exerciseTypes, now)
      console.log(`✅ Created ${count} workout sessions for ${userData.email}`)
    } else {
      console.log(`ℹ️  Exercise history already exists for ${userData.email}`)
    }
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
