'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { getGuestExercises, hasGuestExercises, clearGuestExercises, type GuestExercise } from '@/lib/guest'
import styles from './page.module.css'

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
        // Fetch from database
        const response = await fetch('/api/exercises')
        if (!response.ok) {
          throw new Error('Failed to fetch exercises')
        }
        const data = await response.json()
        setExercises(data.exercises || [])
      } else {
        // Fetch from localStorage for guests
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
      fetchExercises() // Refresh to show migrated exercises
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

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading stats...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <p>{error}</p>
          <button onClick={fetchExercises} className={styles.retryButton}>
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (status === 'loading') {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading...</div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>Exercise Statistics</h1>
        
        {showGuestPrompt && (
          <div className={styles.guestPrompt}>
            <div className={styles.guestPromptContent}>
              <h3>💾 Save Your Stats</h3>
              <p>
                You have {exercises.length} exercise session{exercises.length !== 1 ? 's' : ''} stored locally. 
                {session?.user 
                  ? ' Click below to migrate them to your account.' 
                  : ' Sign up to save them to your account and access them from any device.'}
              </p>
              <div className={styles.guestPromptActions}>
                {session?.user ? (
                  <button 
                    onClick={handleMigrateGuestData} 
                    className={styles.migrateButton}
                    disabled={migrating}
                  >
                    {migrating ? 'Migrating...' : 'Migrate to Account'}
                  </button>
                ) : (
                  <>
                    <button 
                      onClick={() => router.push('/auth/signup')} 
                      className={styles.signUpButton}
                    >
                      Sign Up
                    </button>
                    <button 
                      onClick={() => setShowGuestPrompt(false)} 
                      className={styles.dismissButton}
                    >
                      Dismiss
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
        
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>📊</div>
            <div className={styles.statValue}>{stats.totalExercises}</div>
            <div className={styles.statLabel}>Total Sessions</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>💪</div>
            <div className={styles.statValue}>{stats.totalReps}</div>
            <div className={styles.statLabel}>Total Reps</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>⏱️</div>
            <div className={styles.statValue}>{formatDuration(stats.totalDuration)}</div>
            <div className={styles.statLabel}>Total Time</div>
          </div>
        </div>

        <div className={styles.exercisesSection}>
          <h2 className={styles.sectionTitle}>Exercise History</h2>
          {exercises.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No exercises completed yet.</p>
              <p className={styles.emptySubtext}>
                Start tracking your exercises to see your stats here!
              </p>
            </div>
          ) : (
            <div className={styles.exercisesList}>
              {exercises.map((exercise) => (
                <div key={exercise.id} className={styles.exerciseCard}>
                  <div className={styles.exerciseHeader}>
                    <div className={styles.exerciseType}>
                      {exercise.exerciseType === 'pushups' ? '💪' : '🏋️'} {exercise.exerciseType.charAt(0).toUpperCase() + exercise.exerciseType.slice(1)}
                    </div>
                    <div className={styles.exerciseDate}>
                      {formatDate(exercise.completedAt)}
                    </div>
                  </div>
                  <div className={styles.exerciseStats}>
                    <div className={styles.exerciseStat}>
                      <span className={styles.statLabel}>Reps:</span>
                      <span className={styles.statValue}>{exercise.count}</span>
                    </div>
                    <div className={styles.exerciseStat}>
                      <span className={styles.statLabel}>Duration:</span>
                      <span className={styles.statValue}>{formatDuration(exercise.duration)}</span>
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
