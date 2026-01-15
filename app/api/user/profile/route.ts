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

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        profileName: true,
        email: true,
        name: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ profileName: user.profileName })
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { profileName } = body

    if (!profileName || typeof profileName !== 'string') {
      return NextResponse.json(
        { error: 'Profile name is required' },
        { status: 400 }
      )
    }

    const trimmedName = profileName.trim()

    if (trimmedName.length < 3) {
      return NextResponse.json(
        { error: 'Profile name must be at least 3 characters' },
        { status: 400 }
      )
    }

    if (trimmedName.length > 30) {
      return NextResponse.json(
        { error: 'Profile name must be 30 characters or less' },
        { status: 400 }
      )
    }

    // Check if profile name is already taken by another user
    const existingUser = await prisma.user.findFirst({
      where: {
        profileName: trimmedName,
        id: { not: session.user.id }, // Exclude current user
      },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'This profile name is already taken. Please choose another.' },
        { status: 400 }
      )
    }

    // Update user profile name
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { profileName: trimmedName },
      select: {
        profileName: true,
      },
    })

    return NextResponse.json({ profileName: updatedUser.profileName })
  } catch (error) {
    console.error('Error updating profile:', error)
    
    // Handle unique constraint violation
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'This profile name is already taken. Please choose another.' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update profile name' },
      { status: 500 }
    )
  }
}
