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

  // Create 2 workout sessions (only if they don't already exist)
  const now = new Date()
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const twoDaysAgo = new Date(now)
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)

  // Check if exercises already exist for this user
  const existingExercises = await prisma.exercise.findMany({
    where: {
      userId: user.id,
      exerciseType: 'pushups',
    },
  })

  if (existingExercises.length === 0) {
    // First workout: 25 pushups, 2 minutes 30 seconds
    const exercise1 = await prisma.exercise.create({
      data: {
        userId: user.id,
        exerciseType: 'pushups',
        count: 25,
        duration: 150000, // 2 minutes 30 seconds in milliseconds
        completedAt: yesterday,
      },
    })
    console.log('✅ Created workout session 1:', exercise1.count, 'pushups')

    // Second workout: 30 pushups, 3 minutes
    const exercise2 = await prisma.exercise.create({
      data: {
        userId: user.id,
        exerciseType: 'pushups',
        count: 30,
        duration: 180000, // 3 minutes in milliseconds
        completedAt: twoDaysAgo,
      },
    })
    console.log('✅ Created workout session 2:', exercise2.count, 'pushups')
  } else {
    console.log('ℹ️  Workout sessions already exist for this user')
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
