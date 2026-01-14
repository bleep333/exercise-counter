'use client'

import { useEffect, useState } from 'react'
import styles from './page.module.css'

interface Exercise {
  id: number
  exercise_type: string
  count: number
  duration: number
  completed_at: string
  created_at: string
}

export default function StatsPage() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchExercises()
  }, [])

  const fetchExercises = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/exercises')
      if (!response.ok) {
        throw new Error('Failed to fetch exercises')
      }
      const data = await response.json()
      setExercises(data.exercises || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load exercises')
    } finally {
      setLoading(false)
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

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>Exercise Statistics</h1>
        
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
                      {exercise.exercise_type === 'pushups' ? '💪' : '🏋️'} {exercise.exercise_type.charAt(0).toUpperCase() + exercise.exercise_type.slice(1)}
                    </div>
                    <div className={styles.exerciseDate}>
                      {formatDate(exercise.completed_at)}
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
