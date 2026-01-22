'use client'

import { useEffect, useState, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { getGuestExercises, hasGuestExercises, clearGuestExercises, deleteGuestExercise, updateGuestExercise, saveGuestExercise, type GuestExercise } from '@/lib/guest'
import { calculateCalories } from '@/lib/calories'
import { getExerciseIconPath } from '@/lib/exercise-icons'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface Exercise {
  id: string
  exerciseType: string
  count: number
  duration: number
  completedAt: string
  createdAt: string
}

type SortColumn = 'date' | 'exercise' | 'count' | 'duration' | 'calories'
type SortDirection = 'asc' | 'desc'
type TabType = 'history' | 'trends'

export default function StatsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [userWeight, setUserWeight] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showGuestPrompt, setShowGuestPrompt] = useState(false)
  const [migrating, setMigrating] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('history')
  const [sortColumn, setSortColumn] = useState<SortColumn>('date')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [filterExerciseType, setFilterExerciseType] = useState<string>('all')
  const [filterDateFrom, setFilterDateFrom] = useState<string>('')
  const [filterDateTo, setFilterDateTo] = useState<string>('')
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null)
  const [confirmingClearAll, setConfirmingClearAll] = useState(false)
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())
  const [editingRepId, setEditingRepId] = useState<string | null>(null)
  const [editingRepValue, setEditingRepValue] = useState<string>('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [addFormData, setAddFormData] = useState({
    exerciseType: 'pushups',
    count: '',
    duration: '',
    completedAt: new Date().toISOString().split('T')[0],
    completedAtTime: new Date().toTimeString().slice(0, 5), // HH:MM format
  })
  const [addFormError, setAddFormError] = useState<string | null>(null)
  const [addingSession, setAddingSession] = useState(false)
  const [selectedExerciseForGraph, setSelectedExerciseForGraph] = useState<string>('all')
  const [graphTimeRange, setGraphTimeRange] = useState<'7days' | '30days' | 'year' | 'overall'>('30days')
  const [selectedExerciseForTrends, setSelectedExerciseForTrends] = useState<string>('all')

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
        setUserWeight(data.weight || null)
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
        setUserWeight(null) // Guest users don't have weight
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

  const handleDeleteClick = (exerciseId: string) => {
    setConfirmingDeleteId(exerciseId)
  }

  const handleDeleteCancel = () => {
    setConfirmingDeleteId(null)
  }

  const handleDeleteConfirm = async (exerciseId: string) => {
    try {
      setConfirmingDeleteId(null)
      
      // Start animation first
      setDeletingIds(prev => new Set(prev).add(exerciseId))

      if (session?.user) {
        // Delete from database
        const response = await fetch(`/api/exercises?id=${exerciseId}`, {
          method: 'DELETE',
        })

        if (!response.ok) {
          throw new Error('Failed to delete exercise')
        }
      } else {
        // Delete from localStorage for guest users
        deleteGuestExercise(exerciseId)
      }

      // Wait for animation to complete before removing from state
      setTimeout(() => {
        setExercises(prev => prev.filter(ex => ex.id !== exerciseId))
        setDeletingIds(prev => {
          const next = new Set(prev)
          next.delete(exerciseId)
          return next
        })
      }, 400) // Slightly longer than animation to ensure it completes
    } catch (err) {
      console.error('Error deleting exercise:', err)
      alert('Failed to delete exercise. Please try again.')
      setDeletingIds(prev => {
        const next = new Set(prev)
        next.delete(exerciseId)
        return next
      })
    }
  }

  const handleClearAllClick = () => {
    setConfirmingClearAll(true)
  }

  const handleClearAllCancel = () => {
    setConfirmingClearAll(false)
  }

  const handleClearAllConfirm = () => {
    try {
      clearGuestExercises()
      // Update exercises state directly without reloading
      setExercises([])
      setConfirmingClearAll(false)
    } catch (err) {
      console.error('Error clearing exercises:', err)
      alert('Failed to clear exercises. Please try again.')
      setConfirmingClearAll(false)
    }
  }

  const handleAddSession = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddFormError(null)

    const count = parseInt(addFormData.count, 10)
    if (isNaN(count) || count <= 0) {
      setAddFormError('Please enter a valid rep count')
      return
    }

    const duration = addFormData.duration ? parseInt(addFormData.duration, 10) * 1000 : 0 // Convert seconds to milliseconds
    if (addFormData.duration && (isNaN(duration) || duration < 0)) {
      setAddFormError('Please enter a valid duration in seconds')
      return
    }

    // Combine date and time
    const completedAt = new Date(`${addFormData.completedAt}T${addFormData.completedAtTime || '00:00'}`)
    if (isNaN(completedAt.getTime())) {
      setAddFormError('Please enter a valid date and time')
      return
    }

    try {
      setAddingSession(true)

      if (session?.user) {
        // Save to database
        const response = await fetch('/api/exercises', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            exerciseType: addFormData.exerciseType,
            count,
            duration,
            completedAt: completedAt.toISOString(),
          }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Failed to save exercise')
        }

        const newExercise = await response.json()
        setExercises(prev => [newExercise, ...prev])
      } else {
        // Save to localStorage for guest users
        saveGuestExercise({
          exerciseType: addFormData.exerciseType,
          count,
          duration,
          completedAt: completedAt.toISOString(),
        })

        const newExercise: Exercise = {
          id: `guest_ex_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          exerciseType: addFormData.exerciseType,
          count,
          duration,
          completedAt: completedAt.toISOString(),
          createdAt: new Date().toISOString(),
        }

        setExercises(prev => [newExercise, ...prev])
      }

      // Reset form
      setAddFormData({
        exerciseType: 'pushups',
        count: '',
        duration: '',
        completedAt: new Date().toISOString().split('T')[0],
        completedAtTime: new Date().toTimeString().slice(0, 5),
      })
      setShowAddForm(false)
    } catch (err) {
      console.error('Error adding session:', err)
      setAddFormError(err instanceof Error ? err.message : 'Failed to add session')
    } finally {
      setAddingSession(false)
    }
  }

  const handleRepEditClick = (exerciseId: string, currentCount: number) => {
    setEditingRepId(exerciseId)
    setEditingRepValue(currentCount.toString())
  }

  const handleRepEditCancel = () => {
    setEditingRepId(null)
    setEditingRepValue('')
  }

  const handleRepEditSave = async (exerciseId: string) => {
    const newCount = parseInt(editingRepValue, 10)
    
    if (isNaN(newCount) || newCount < 0) {
      alert('Please enter a valid non-negative number')
      return
    }

    try {
      if (session?.user) {
        // Update in database
        const response = await fetch(`/api/exercises?id=${exerciseId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ count: newCount }),
        })

        if (!response.ok) {
          throw new Error('Failed to update exercise')
        }

        const updatedExercise = await response.json()
        
        // Update local state
        setExercises(prev => prev.map(ex => 
          ex.id === exerciseId 
            ? { ...ex, count: updatedExercise.count }
            : ex
        ))
      } else {
        // Update in localStorage for guest users
        updateGuestExercise(exerciseId, newCount)
        
        // Update local state
        setExercises(prev => prev.map(ex => 
          ex.id === exerciseId 
            ? { ...ex, count: newCount }
            : ex
        ))
      }

      setEditingRepId(null)
      setEditingRepValue('')
    } catch (err) {
      console.error('Error updating rep count:', err)
      alert('Failed to update rep count. Please try again.')
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

  // Get unique exercise types
  const exerciseTypes = useMemo(() => {
    const types = new Set(exercises.map(ex => ex.exerciseType))
    return Array.from(types).sort()
  }, [exercises])

  // Common exercise types for the add form
  const commonExerciseTypes = ['pushups', 'situps', 'squats', 'pullups']

  // Handle column header click for sorting
  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      // Toggle direction if clicking the same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      // Set new column with default descending direction
      setSortColumn(column)
      setSortDirection('desc')
    }
  }

  // Filter and sort exercises
  const filteredAndSortedExercises = useMemo(() => {
    let filtered = [...exercises]

    // Filter by exercise type
    if (filterExerciseType !== 'all') {
      filtered = filtered.filter(ex => ex.exerciseType === filterExerciseType)
    }

    // Filter by date range
    if (filterDateFrom) {
      const fromDate = new Date(filterDateFrom)
      fromDate.setHours(0, 0, 0, 0)
      filtered = filtered.filter(ex => new Date(ex.completedAt) >= fromDate)
    }
    if (filterDateTo) {
      const toDate = new Date(filterDateTo)
      toDate.setHours(23, 59, 59, 999)
      filtered = filtered.filter(ex => new Date(ex.completedAt) <= toDate)
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0
      
      switch (sortColumn) {
        case 'date':
          comparison = new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
          break
        case 'exercise':
          comparison = a.exerciseType.localeCompare(b.exerciseType)
          break
        case 'count':
          comparison = a.count - b.count
          break
        case 'duration':
          comparison = a.duration - b.duration
          break
        case 'calories':
          const caloriesA = calculateCalories(a.exerciseType, a.count, userWeight) || 0
          const caloriesB = calculateCalories(b.exerciseType, b.count, userWeight) || 0
          comparison = caloriesA - caloriesB
          break
      }

      return sortDirection === 'asc' ? comparison : -comparison
    })

    return filtered
  }, [exercises, sortColumn, sortDirection, filterExerciseType, filterDateFrom, filterDateTo, userWeight])

  // Calculate trends
  const trends = useMemo(() => {
    if (exercises.length === 0) {
      return {
        daily: { count: 0, reps: 0, duration: 0 },
        weekly: { count: 0, reps: 0, duration: 0 },
        monthly: { count: 0, reps: 0, duration: 0 },
      }
    }

    // Filter by selected exercise for trends
    let filteredExercises = exercises
    if (selectedExerciseForTrends !== 'all') {
      filteredExercises = exercises.filter(ex => ex.exerciseType === selectedExerciseForTrends)
    }

    if (filteredExercises.length === 0) {
      return {
        daily: { count: 0, reps: 0, duration: 0 },
        weekly: { count: 0, reps: 0, duration: 0 },
        monthly: { count: 0, reps: 0, duration: 0 },
      }
    }

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekAgo = new Date(today)
    weekAgo.setDate(weekAgo.getDate() - 7)
    const monthAgo = new Date(today)
    monthAgo.setMonth(monthAgo.getMonth() - 1)

    const dailyExercises = filteredExercises.filter(ex => new Date(ex.completedAt) >= today)
    const weeklyExercises = filteredExercises.filter(ex => new Date(ex.completedAt) >= weekAgo)
    const monthlyExercises = filteredExercises.filter(ex => new Date(ex.completedAt) >= monthAgo)

    const calculateAvg = (exs: Exercise[]) => {
      if (exs.length === 0) return { count: 0, reps: 0, duration: 0 }
      const days = Math.max(1, Math.ceil((now.getTime() - Math.min(...exs.map(e => new Date(e.completedAt).getTime()))) / (1000 * 60 * 60 * 24)))
      return {
        count: exs.length / days,
        reps: exs.reduce((sum, e) => sum + e.count, 0) / days,
        duration: exs.reduce((sum, e) => sum + e.duration, 0) / days,
      }
    }

    return {
      daily: {
        count: dailyExercises.length,
        reps: dailyExercises.reduce((sum, e) => sum + e.count, 0),
        duration: dailyExercises.reduce((sum, e) => sum + e.duration, 0),
      },
      weekly: calculateAvg(weeklyExercises),
      monthly: calculateAvg(monthlyExercises),
    }
  }, [exercises, selectedExerciseForTrends])

  const getTotalStats = () => {
    const totalExercises = exercises.length
    const totalReps = exercises.reduce((sum, ex) => sum + ex.count, 0)
    const totalDuration = exercises.reduce((sum, ex) => sum + ex.duration, 0)
    
    return { totalExercises, totalReps, totalDuration }
  }

  const stats = getTotalStats()

  // Process data for the line graph
  const graphData = useMemo(() => {
    if (exercises.length === 0) return []

    // Filter by selected exercise
    let filteredExercises = exercises
    if (selectedExerciseForGraph !== 'all') {
      filteredExercises = exercises.filter(ex => ex.exerciseType === selectedExerciseForGraph)
    }

    if (filteredExercises.length === 0) return []

    // Calculate date range
    const now = new Date()
    let startDate: Date

    switch (graphTimeRange) {
      case '7days':
        startDate = new Date(now)
        startDate.setDate(startDate.getDate() - 7)
        startDate.setHours(0, 0, 0, 0)
        break
      case '30days':
        startDate = new Date(now)
        startDate.setDate(startDate.getDate() - 30)
        startDate.setHours(0, 0, 0, 0)
        break
      case 'year':
        startDate = new Date(now)
        startDate.setFullYear(startDate.getFullYear() - 1)
        startDate.setHours(0, 0, 0, 0)
        break
      case 'overall':
        // Start from earliest recorded rep
        const earliestDate = new Date(Math.min(...filteredExercises.map(ex => new Date(ex.completedAt).getTime())))
        startDate = new Date(earliestDate)
        startDate.setHours(0, 0, 0, 0)
        break
    }

    // Filter exercises within date range
    const exercisesInRange = filteredExercises.filter(ex => {
      const exDate = new Date(ex.completedAt)
      return exDate >= startDate && exDate <= now
    })

    if (exercisesInRange.length === 0) return []

    // Group by date and sum reps
    const dateMap = new Map<string, number>()
    
    exercisesInRange.forEach(ex => {
      const date = new Date(ex.completedAt)
      const dateKey = date.toISOString().split('T')[0] // YYYY-MM-DD format
      const currentReps = dateMap.get(dateKey) || 0
      dateMap.set(dateKey, currentReps + ex.count)
    })

    // Convert to array and sort by date
    const data = Array.from(dateMap.entries())
      .map(([date, reps]) => {
        const dateObj = new Date(date)
        let displayDate: string
        
        if (graphTimeRange === '7days') {
          // For 7 days, show day name and date
          displayDate = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
        } else if (graphTimeRange === '30days') {
          // For 30 days, show month and day
          displayDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        } else if (graphTimeRange === 'year') {
          // For year, show month, day, and year
          displayDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        } else {
          // For overall, show month, day, and year
          displayDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        }
        
        return {
          date,
          reps,
          displayDate
        }
      })
      .sort((a, b) => a.date.localeCompare(b.date))

    return data
  }, [exercises, selectedExerciseForGraph, graphTimeRange])

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
            className="px-6 py-3 bg-white text-teal-600 rounded-lg font-semibold hover:bg-teal-50 hover:-translate-y-0.5 transition-all shadow-md"
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
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent mb-8 text-center">
          Session History
        </h1>
        
        {showGuestPrompt && (() => {
          const guestExercises = getGuestExercises()
          const guestCount = guestExercises.length
          return (
            <div className="bg-gradient-to-r from-teal-600 to-emerald-600 rounded-2xl p-6 sm:p-8 mb-8 shadow-xl">
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
                      className="px-6 py-3 bg-white text-teal-600 rounded-lg font-semibold hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    disabled={migrating}
                  >
                    {migrating ? 'Migrating...' : 'Migrate to Account'}
                  </button>
                ) : (
                  <>
                    <button 
                      onClick={() => router.push('/auth/signup')} 
                        className="px-6 py-3 bg-white text-teal-600 rounded-lg font-semibold hover:shadow-lg hover:-translate-y-0.5 transition-all"
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
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 text-center shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all">
            <div className="text-2xl sm:text-3xl mb-2">📊</div>
            <div className="text-xl sm:text-2xl font-bold text-gray-800 mb-1">{stats.totalExercises}</div>
            <div className="text-xs sm:text-sm text-gray-600 font-semibold">Total Sessions</div>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all">
            <div className="mb-2 flex items-center justify-center">
              {getExerciseIconPath('pushups') ? (
                <Image 
                  src={getExerciseIconPath('pushups')!} 
                  alt="Exercise icon" 
                  width={32} 
                  height={32}
                  className="w-6 h-6 sm:w-8 sm:h-8"
                />
              ) : (
                <span className="text-2xl sm:text-3xl">💪</span>
              )}
            </div>
            <div className="text-xl sm:text-2xl font-bold text-gray-800 mb-1">{stats.totalReps}</div>
            <div className="text-xs sm:text-sm text-gray-600 font-semibold">Total Reps</div>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all">
            <div className="text-2xl sm:text-3xl mb-2">⏱️</div>
            <div className="text-xl sm:text-2xl font-bold text-gray-800 mb-1">{formatDuration(stats.totalDuration)}</div>
            <div className="text-xs sm:text-sm text-gray-600 font-semibold">Total Time</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('history')}
            className={`px-6 py-3 font-semibold transition-all relative ${
              activeTab === 'history'
                ? 'text-teal-600'
                : 'text-gray-600 hover:text-teal-600'
            }`}
          >
            History
            {activeTab === 'history' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-teal-600 to-emerald-600 rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('trends')}
            className={`px-6 py-3 font-semibold transition-all relative ${
              activeTab === 'trends'
                ? 'text-teal-600'
                : 'text-gray-600 hover:text-teal-600'
            }`}
          >
            Trends
            {activeTab === 'trends' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-teal-600 to-emerald-600 rounded-full" />
            )}
          </button>
        </div>

        {activeTab === 'history' ? (
          <>
            {/* Filters and Add Session */}
            <div className="mb-6">
              {!showAddForm ? (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <select
                      value={filterExerciseType}
                      onChange={(e) => setFilterExerciseType(e.target.value)}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-teal-600 transition-colors"
                    >
                      <option value="all">All Exercises</option>
                      {exerciseTypes.map(type => (
                        <option key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </option>
                      ))}
                    </select>
                    <input
                      type="date"
                      value={filterDateFrom}
                      onChange={(e) => setFilterDateFrom(e.target.value)}
                      placeholder="From"
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-teal-600 transition-colors"
                    />
                    <input
                      type="date"
                      value={filterDateTo}
                      onChange={(e) => setFilterDateTo(e.target.value)}
                      placeholder="To"
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-teal-600 transition-colors"
                    />
                    {(filterExerciseType !== 'all' || filterDateFrom || filterDateTo) && (
                      <button
                        onClick={() => {
                          setFilterExerciseType('all')
                          setFilterDateFrom('')
                          setFilterDateTo('')
                        }}
                        className="px-3 py-1.5 text-xs text-teal-600 hover:text-teal-700 font-semibold"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="px-4 py-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-lg font-semibold text-sm shadow-md hover:shadow-lg transition-all"
                  >
                    + Add Session
                  </button>
            </div>
          ) : (
                <div className="bg-white rounded-xl p-4 shadow-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-bold text-gray-800">Add Session</h2>
                    <button
                      onClick={() => {
                        setShowAddForm(false)
                        setAddFormError(null)
                        setAddFormData({
                          exerciseType: 'pushups',
                          count: '',
                          duration: '',
                          completedAt: new Date().toISOString().split('T')[0],
                          completedAtTime: new Date().toTimeString().slice(0, 5),
                        })
                      }}
                      className="text-gray-500 hover:text-gray-700 text-xl font-bold"
                    >
                      ×
                    </button>
                  </div>

                  {addFormError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg mb-3 text-xs">
                      {addFormError}
                    </div>
                  )}

                  <form onSubmit={handleAddSession} className="space-y-3">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-gray-700">Exercise *</label>
                        <select
                          value={addFormData.exerciseType}
                          onChange={(e) => setAddFormData({ ...addFormData, exerciseType: e.target.value })}
                          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-teal-600 transition-colors"
                          required
                        >
                          {commonExerciseTypes.map(type => (
                            <option key={type} value={type}>
                              {type.charAt(0).toUpperCase() + type.slice(1)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-gray-700">Reps *</label>
                        <input
                          type="number"
                          value={addFormData.count}
                          onChange={(e) => setAddFormData({ ...addFormData, count: e.target.value })}
                          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-teal-600 transition-colors"
                          min="1"
                          required
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-gray-700">Duration (s)</label>
                        <input
                          type="number"
                          value={addFormData.duration}
                          onChange={(e) => setAddFormData({ ...addFormData, duration: e.target.value })}
                          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-teal-600 transition-colors"
                          min="0"
                          placeholder="Optional"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-gray-700">Date *</label>
                        <input
                          type="date"
                          value={addFormData.completedAt}
                          onChange={(e) => setAddFormData({ ...addFormData, completedAt: e.target.value })}
                          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-teal-600 transition-colors"
                          required
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-gray-700">Time</label>
                        <input
                          type="time"
                          value={addFormData.completedAtTime}
                          onChange={(e) => setAddFormData({ ...addFormData, completedAtTime: e.target.value })}
                          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-teal-600 transition-colors"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={addingSession}
                        className="px-4 py-1.5 text-sm bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-lg font-semibold hover:shadow-md transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {addingSession ? 'Adding...' : 'Add'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddForm(false)
                          setAddFormError(null)
                          setAddFormData({
                            exerciseType: 'pushups',
                            count: '',
                            duration: '',
                            completedAt: new Date().toISOString().split('T')[0],
                            completedAtTime: new Date().toTimeString().slice(0, 5),
                          })
                        }}
                        className="px-4 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>


            <div className="mt-8">
              {session?.user && !userWeight && (
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">💡</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-blue-800 mb-1">
                        Add Your Weight to See Calories Burned
                      </p>
                      <p className="text-xs text-blue-700 mb-3">
                        Enter your weight in your account settings to see calorie estimates for each exercise session.
                      </p>
                      <button
                        onClick={() => router.push('/account')}
                        className="px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Go to Account Settings
                      </button>
                    </div>
                  </div>
                </div>
              )}
              <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                {filteredAndSortedExercises.length !== exercises.length && (
                  <div className="text-sm text-gray-500">
                    Showing {filteredAndSortedExercises.length} of {exercises.length} exercises
                  </div>
                )}
                {!session?.user && exercises.length > 0 && (
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    {confirmingClearAll ? (
                      <>
                        <button
                          onClick={handleClearAllConfirm}
                          className="px-4 py-2 text-sm font-semibold text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                        >
                          Confirm Clear All
                        </button>
                        <button
                          onClick={handleClearAllCancel}
                          className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={handleClearAllClick}
                        className="px-4 py-2 text-sm font-semibold text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        Clear All Sessions
                      </button>
                    )}
                  </div>
                )}
              </div>
              {filteredAndSortedExercises.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 sm:p-12 text-center shadow-lg">
                  <p className="text-lg sm:text-xl text-gray-600 mb-2">
                    {exercises.length === 0 
                      ? 'No exercises completed yet.'
                      : 'No exercises match your filters.'}
                  </p>
                  <p className="text-base text-gray-500">
                    {exercises.length === 0
                      ? 'Start tracking your exercises to see your stats here!'
                      : 'Try adjusting your filters to see more results.'}
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                  <div className="overflow-x-auto -mx-4 sm:mx-0">
                    <div className="inline-block min-w-full align-middle">
                      <table className="min-w-full table-fixed">
                        <colgroup>
                          <col className="w-[18%] sm:w-[22%]" />
                          <col className="w-[22%] sm:w-[22%]" />
                          <col className="w-[12%] sm:w-[12%]" />
                          <col className="w-[12%] sm:w-[12%]" />
                          <col className="w-[20%] sm:w-[18%]" />
                          <col style={{ width: '70px', minWidth: '70px', maxWidth: '70px' }} />
                        </colgroup>
                        <thead className="bg-gray-50">
                          <tr>
                            <th
                              onClick={() => handleSort('exercise')}
                              className="px-2 sm:px-4 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 active:bg-gray-200 transition-colors select-none touch-manipulation"
                            >
                              <div className="flex items-center gap-1 sm:gap-2">
                                Exercise
                                {sortColumn === 'exercise' && (
                                  <span className="text-teal-600 text-xs sm:text-sm">
                                    {sortDirection === 'asc' ? '↑' : '↓'}
                                  </span>
                                )}
                              </div>
                            </th>
                            <th
                              onClick={() => handleSort('date')}
                              className="px-2 sm:px-4 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 active:bg-gray-200 transition-colors select-none touch-manipulation"
                            >
                              <div className="flex items-center gap-1 sm:gap-2">
                                Date
                                {sortColumn === 'date' && (
                                  <span className="text-teal-600 text-xs sm:text-sm">
                                    {sortDirection === 'asc' ? '↑' : '↓'}
                                  </span>
                                )}
                              </div>
                            </th>
                            <th
                              onClick={() => handleSort('count')}
                              className="px-2 sm:px-4 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 active:bg-gray-200 transition-colors select-none touch-manipulation"
                            >
                              <div className="flex items-center gap-1 sm:gap-2">
                                Reps
                                {sortColumn === 'count' && (
                                  <span className="text-teal-600 text-xs sm:text-sm">
                                    {sortDirection === 'asc' ? '↑' : '↓'}
                                  </span>
                                )}
                              </div>
                            </th>
                            <th
                              onClick={() => handleSort('duration')}
                              className="px-2 sm:px-4 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 active:bg-gray-200 transition-colors select-none touch-manipulation"
                            >
                              <div className="flex items-center gap-1 sm:gap-2">
                                Duration
                                {sortColumn === 'duration' && (
                                  <span className="text-teal-600 text-xs sm:text-sm">
                                    {sortDirection === 'asc' ? '↑' : '↓'}
                                  </span>
                                )}
                              </div>
                            </th>
                            <th
                              onClick={() => handleSort('calories')}
                              className="px-2 sm:px-4 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 active:bg-gray-200 transition-colors select-none touch-manipulation"
                            >
                              <div className="flex items-center gap-1 sm:gap-2">
                                Calories
                                {sortColumn === 'calories' && (
                                  <span className="text-teal-600 text-xs sm:text-sm">
                                    {sortDirection === 'asc' ? '↑' : '↓'}
                                  </span>
                                )}
                              </div>
                            </th>
                            <th className="px-1 py-3 sm:py-4 text-center text-xs sm:text-sm font-semibold text-gray-700" style={{ width: '70px', minWidth: '70px', maxWidth: '70px' }}>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {filteredAndSortedExercises.map((exercise) => {
                            const calories = calculateCalories(exercise.exerciseType, exercise.count, userWeight)
                            const isDeleting = deletingIds.has(exercise.id)
                            return (
                              <tr
                                key={exercise.id}
                                className={`hover:bg-teal-50 ${isDeleting ? 'animate-slide-out' : ''}`}
                              >
                                <td className="px-2 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm font-medium text-gray-900">
                                  <div className="flex items-center gap-1 sm:gap-2">
                                    {getExerciseIconPath(exercise.exerciseType) ? (
                                      <Image 
                                        src={getExerciseIconPath(exercise.exerciseType)!} 
                                        alt={`${exercise.exerciseType} icon`} 
                                        width={16} 
                                        height={16}
                                        className="w-4 h-4 sm:w-5 sm:h-5"
                                      />
                                    ) : (
                                      <span className="text-sm sm:text-base">{exercise.exerciseType === 'pushups' ? '💪' : '🏋️'}</span>
                                    )}
                                    <span className="truncate">{exercise.exerciseType.charAt(0).toUpperCase() + exercise.exerciseType.slice(1)}</span>
                                  </div>
                                </td>
                                <td className="px-2 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm text-gray-600">
                                  <span className="whitespace-nowrap">{formatDate(exercise.completedAt)}</span>
                                </td>
                                <td className="px-2 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-teal-600 whitespace-nowrap">
                                  {editingRepId === exercise.id ? (
                                    <div className="flex items-center gap-1">
                                      <input
                                        type="number"
                                        value={editingRepValue}
                                        onChange={(e) => setEditingRepValue(e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            handleRepEditSave(exercise.id)
                                          } else if (e.key === 'Escape') {
                                            handleRepEditCancel()
                                          }
                                        }}
                                        className="w-20 px-2 py-1 border-2 border-teal-300 rounded focus:outline-none focus:border-teal-600 text-sm"
                                        min="0"
                                        autoFocus
                                      />
                                      <button
                                        onClick={() => handleRepEditSave(exercise.id)}
                                        className="text-green-600 hover:text-green-700 font-semibold text-base px-1 py-1 rounded hover:bg-green-50 transition-colors leading-none"
                                        title="Save"
                                      >
                                        ✓
                                      </button>
                                      <button
                                        onClick={handleRepEditCancel}
                                        className="text-gray-600 hover:text-gray-700 font-semibold text-base px-1 py-1 rounded hover:bg-gray-50 transition-colors leading-none"
                                        title="Cancel"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => handleRepEditClick(exercise.id, exercise.count)}
                                      className="hover:bg-teal-50 px-2 py-1 rounded transition-colors cursor-pointer"
                                      title="Click to edit rep count"
                                    >
                                      {exercise.count.toLocaleString()}
                                    </button>
                                  )}
                                </td>
                                <td className="px-2 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-teal-600 whitespace-nowrap">
                                  {formatDuration(exercise.duration)}
                                </td>
                                <td className="px-2 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-teal-600 whitespace-nowrap">
                                  {calories !== null ? (
                                    `${calories.toFixed(1)} kcal`
                                  ) : (
                                    <span className="text-gray-400 italic">Unavailable</span>
                                  )}
                                </td>
                                <td className="px-1 py-3 sm:py-4 text-center" style={{ width: '70px', minWidth: '70px', maxWidth: '70px', tableLayout: 'fixed' }}>
                                  <div className="flex items-center justify-center w-full" style={{ width: '70px', minWidth: '70px', maxWidth: '70px' }}>
                                    {confirmingDeleteId === exercise.id ? (
                                      <div className="flex items-center gap-1 justify-center w-full">
                                        <button
                                          onClick={() => handleDeleteConfirm(exercise.id)}
                                          className="text-red-600 hover:text-red-700 font-semibold text-base px-1 py-1 rounded hover:bg-red-50 transition-colors leading-none"
                                          title="Confirm delete"
                                        >
                                          ✓
                                        </button>
                                        <button
                                          onClick={handleDeleteCancel}
                                          className="text-gray-600 hover:text-gray-700 font-semibold text-base px-1 py-1 rounded hover:bg-gray-50 transition-colors leading-none"
                                          title="Cancel"
                                        >
                                          ✕
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={() => handleDeleteClick(exercise.id)}
                                        className="text-red-600 hover:text-red-700 transition-colors p-1 hover:bg-red-50 rounded inline-flex items-center justify-center"
                                        title="Delete this session"
                                        style={{ width: '28px', height: '28px' }}
                                      >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                      </button>
                                    )}
                    </div>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="mt-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">Exercise Trends</h2>
            
            {/* Exercise Selector for Trends */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Filter by Exercise</label>
              <select
                value={selectedExerciseForTrends}
                onChange={(e) => setSelectedExerciseForTrends(e.target.value)}
                className="w-full sm:w-auto px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-teal-600 transition-colors"
              >
                <option value="all">All Exercises</option>
                {exerciseTypes.map(type => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Daily */}
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h3 className="text-xl font-bold text-gray-800 mb-4">📅 Today</h3>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Sessions</div>
                    <div className="text-2xl font-bold text-teal-600">{trends.daily.count}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Total Reps</div>
                    <div className="text-2xl font-bold text-teal-600">{trends.daily.reps}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Total Duration</div>
                    <div className="text-2xl font-bold text-teal-600">{formatDuration(trends.daily.duration)}</div>
                  </div>
                </div>
              </div>

              {/* Weekly Average */}
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h3 className="text-xl font-bold text-gray-800 mb-4">📊 Weekly Average</h3>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Sessions/Day</div>
                    <div className="text-2xl font-bold text-teal-600">{trends.weekly.count.toFixed(1)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Reps/Day</div>
                    <div className="text-2xl font-bold text-teal-600">{Math.round(trends.weekly.reps)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Duration/Day</div>
                    <div className="text-2xl font-bold text-teal-600">{formatDuration(Math.round(trends.weekly.duration))}</div>
                  </div>
                </div>
              </div>

              {/* Monthly Average */}
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h3 className="text-xl font-bold text-gray-800 mb-4">📈 Monthly Average</h3>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Sessions/Day</div>
                    <div className="text-2xl font-bold text-teal-600">{trends.monthly.count.toFixed(1)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Reps/Day</div>
                    <div className="text-2xl font-bold text-teal-600">{Math.round(trends.monthly.reps)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Duration/Day</div>
                    <div className="text-2xl font-bold text-teal-600">{formatDuration(Math.round(trends.monthly.duration))}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Rep Count vs Date Line Graph */}
            <div className="bg-white rounded-2xl p-6 shadow-lg mt-8">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6">Trend Graph</h3>
              
              {/* Controls */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                {/* Exercise Selector */}
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Exercise</label>
                  <select
                    value={selectedExerciseForGraph}
                    onChange={(e) => setSelectedExerciseForGraph(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-teal-600 transition-colors"
                  >
                    <option value="all">All Exercises</option>
                    {exerciseTypes.map(type => (
                      <option key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Time Range Buttons */}
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Time Range</label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setGraphTimeRange('7days')}
                      className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                        graphTimeRange === '7days'
                          ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      7 Days
                    </button>
                    <button
                      onClick={() => setGraphTimeRange('30days')}
                      className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                        graphTimeRange === '30days'
                          ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      30 Days
                    </button>
                    <button
                      onClick={() => setGraphTimeRange('year')}
                      className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                        graphTimeRange === 'year'
                          ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Past Year
                    </button>
                    <button
                      onClick={() => setGraphTimeRange('overall')}
                      className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                        graphTimeRange === 'overall'
                          ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Overall
                    </button>
                  </div>
                </div>
              </div>

              {/* Graph */}
              {graphData.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <p>No data available for the selected filters.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={graphData} margin={{ top: 5, right: 30, left: 20, bottom: 80 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="displayDate" 
                      stroke="#6b7280"
                      style={{ fontSize: '12px' }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      interval={graphData.length > 30 ? Math.floor(graphData.length / 15) : 0}
                    />
                    <YAxis 
                      label={{ value: 'Reps', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#6b7280' } }}
                      stroke="#6b7280"
                      style={{ fontSize: '12px' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb', 
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                      labelStyle={{ color: '#374151', fontWeight: 'bold' }}
                      formatter={(value: number | undefined) => [value?.toLocaleString() ?? '0', 'Reps']}
                    />
                    {/* <Legend /> */}
                    <Line 
                      type="monotone" 
                      dataKey="reps" 
                      stroke="#14b8a6" 
                      strokeWidth={2}
                      dot={{ fill: '#14b8a6', r: 4 }}
                      activeDot={{ r: 6 }}
                      name="Reps"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
            </div>
          )}
      </div>
    </div>
  )
}
