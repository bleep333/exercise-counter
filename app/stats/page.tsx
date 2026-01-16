'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { getGuestExercises, hasGuestExercises, clearGuestExercises, type GuestExercise } from '@/lib/guest'

interface Exercise {
  id: string
  exerciseType: string
  count: number
  duration: number
  completedAt: string
  createdAt: string
}

export default function StatsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showGuestPrompt, setShowGuestPrompt] = useState(false)
  const [migrating, setMigrating] = useState(false)

  useEffect(() => {
    fetchExercises()
  }, [session])

  const fetchExercises = async () => {
    try {
      setLoading(true)
      
      if (session?.user) {
        const response = await fetch('/api/exercises')
        if (!response.ok) {
          throw new Error('Failed to fetch exercises')
        }
        const data = await response.json()
        setExercises(data.exercises || [])
        // Check for guest exercises even when signed in (for migration after signup)
        setShowGuestPrompt(hasGuestExercises())
      } else {
        const guestExercises = getGuestExercises()
        setExercises(guestExercises.map(ex => ({
          id: ex.id,
          exerciseType: ex.exerciseType,
          count: ex.count,
          duration: ex.duration,
          completedAt: ex.completedAt,
          createdAt: ex.createdAt,
        })))
        setShowGuestPrompt(hasGuestExercises())
      }
      
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load exercises')
    } finally {
      setLoading(false)
    }
  }

  const handleMigrateGuestData = async () => {
    if (!session?.user) {
      router.push('/auth/signup')
      return
    }

    try {
      setMigrating(true)
      const guestExercises = getGuestExercises()
      
      if (guestExercises.length === 0) {
        setShowGuestPrompt(false)
        return
      }

      const response = await fetch('/api/auth/migrate-guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exercises: guestExercises }),
      })

      if (!response.ok) {
        throw new Error('Failed to migrate exercises')
      }

      clearGuestExercises()
      setShowGuestPrompt(false)
      fetchExercises()
    } catch (err) {
      console.error('Error migrating guest data:', err)
      alert('Failed to migrate exercises. Please try again.')
    } finally {
      setMigrating(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const getTotalStats = () => {
    const totalExercises = exercises.length
    const totalReps = exercises.reduce((sum, ex) => sum + ex.count, 0)
    const totalDuration = exercises.reduce((sum, ex) => sum + ex.duration, 0)
    
    return { totalExercises, totalReps, totalDuration }
  }

  const stats = getTotalStats()

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
        <div className="text-xl text-gray-600">Loading stats...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-500 text-xl mb-4">{error}</p>
          <button 
            onClick={fetchExercises} 
            className="px-6 py-3 bg-white text-purple-600 rounded-lg font-semibold hover:bg-purple-50 hover:-translate-y-0.5 transition-all shadow-md"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 sm:py-12 px-4 sm:px-6 lg:px-8 flex justify-center">
      <div className="max-w-5xl w-full">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-8 text-center">
          Exercise Statistics
        </h1>
        
        {showGuestPrompt && (() => {
          const guestExercises = getGuestExercises()
          const guestCount = guestExercises.length
          return (
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6 sm:p-8 mb-8 shadow-xl">
              <div className="text-white">
                <h3 className="text-xl sm:text-2xl font-bold mb-3">💾 Save Your Stats</h3>
                <p className="text-base sm:text-lg mb-6 leading-relaxed opacity-95">
                  You have {guestCount} exercise session{guestCount !== 1 ? 's' : ''} not added to account. 
                  {session?.user 
                    ? ' Click below to migrate them to your account.' 
                    : ' Sign up to save them to your account and access them from any device.'}
                </p>
                <div className="flex flex-wrap gap-3">
                  {session?.user ? (
                    <button 
                      onClick={handleMigrateGuestData} 
                      className="px-6 py-3 bg-white text-purple-600 rounded-lg font-semibold hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                      disabled={migrating}
                    >
                      {migrating ? 'Migrating...' : 'Migrate to Account'}
                    </button>
                  ) : (
                    <>
                      <button 
                        onClick={() => router.push('/auth/signup')} 
                        className="px-6 py-3 bg-white text-purple-600 rounded-lg font-semibold hover:shadow-lg hover:-translate-y-0.5 transition-all"
                      >
                        Sign Up
                      </button>
                      <button 
                        onClick={() => setShowGuestPrompt(false)} 
                        className="px-6 py-3 bg-white/20 text-white border-2 border-white rounded-lg font-semibold hover:bg-white/30 transition-all"
                      >
                        Dismiss
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )
        })()}
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 text-center shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all">
            <div className="text-4xl sm:text-5xl mb-3">📊</div>
            <div className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2">{stats.totalExercises}</div>
            <div className="text-sm sm:text-base text-gray-600 font-semibold">Total Sessions</div>
          </div>
          <div className="bg-white rounded-2xl p-6 text-center shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all">
            <div className="text-4xl sm:text-5xl mb-3">💪</div>
            <div className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2">{stats.totalReps}</div>
            <div className="text-sm sm:text-base text-gray-600 font-semibold">Total Reps</div>
          </div>
          <div className="bg-white rounded-2xl p-6 text-center shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all">
            <div className="text-4xl sm:text-5xl mb-3">⏱️</div>
            <div className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2">{formatDuration(stats.totalDuration)}</div>
            <div className="text-sm sm:text-base text-gray-600 font-semibold">Total Time</div>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">Exercise History</h2>
          {exercises.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 sm:p-12 text-center shadow-lg">
              <p className="text-lg sm:text-xl text-gray-600 mb-2">No exercises completed yet.</p>
              <p className="text-base text-gray-500">
                Start tracking your exercises to see your stats here!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {exercises.map((exercise) => (
                <div key={exercise.id} className="bg-white rounded-2xl p-4 sm:p-6 shadow-md hover:shadow-lg hover:translate-x-1 transition-all">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
                    <div className="text-lg sm:text-xl font-bold text-gray-800">
                      {exercise.exerciseType === 'pushups' ? '💪' : '🏋️'} {exercise.exerciseType.charAt(0).toUpperCase() + exercise.exerciseType.slice(1)}
                    </div>
                    <div className="text-sm sm:text-base text-gray-600">
                      {formatDate(exercise.completedAt)}
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
                    <div className="flex items-center gap-2">
                      <span className="text-sm sm:text-base text-gray-600 font-medium">Reps:</span>
                      <span className="text-lg sm:text-xl font-bold text-purple-600">{exercise.count}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm sm:text-base text-gray-600 font-medium">Duration:</span>
                      <span className="text-lg sm:text-xl font-bold text-purple-600">{formatDuration(exercise.duration)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
