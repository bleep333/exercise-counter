import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

export async function GET() {
  try {
    const exercises = db
      .prepare('SELECT * FROM exercises ORDER BY completed_at DESC')
      .all()
    
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
    const body = await request.json()
    const { exerciseType, count, duration, completedAt } = body

    if (!exerciseType || count === undefined || duration === undefined || !completedAt) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const result = db
      .prepare(
        'INSERT INTO exercises (exercise_type, count, duration, completed_at) VALUES (?, ?, ?, ?)'
      )
      .run(exerciseType, count, duration, completedAt)

    return NextResponse.json({
      id: result.lastInsertRowid,
      exerciseType,
      count,
      duration,
      completedAt,
    })
  } catch (error) {
    console.error('Error saving exercise:', error)
    return NextResponse.json(
      { error: 'Failed to save exercise' },
      { status: 500 }
    )
  }
}
