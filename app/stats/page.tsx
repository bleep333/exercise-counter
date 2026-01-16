'use client'

import { useEffect, useState, useMemo } from 'react'
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

type SortColumn = 'date' | 'exercise' | 'count' | 'duration'
type SortDirection = 'asc' | 'desc'
type TabType = 'history' | 'trends'

export default function StatsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [exercises, setExercises] = useState<Exercise[]>([])
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

  // Get unique exercise types
  const exerciseTypes = useMemo(() => {
    const types = new Set(exercises.map(ex => ex.exerciseType))
    return Array.from(types).sort()
  }, [exercises])

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
      }

      return sortDirection === 'asc' ? comparison : -comparison
    })

    return filtered
  }, [exercises, sortColumn, sortDirection, filterExerciseType, filterDateFrom, filterDateTo])

  // Calculate trends
  const trends = useMemo(() => {
    if (exercises.length === 0) {
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

    const dailyExercises = exercises.filter(ex => new Date(ex.completedAt) >= today)
    const weeklyExercises = exercises.filter(ex => new Date(ex.completedAt) >= weekAgo)
    const monthlyExercises = exercises.filter(ex => new Date(ex.completedAt) >= monthAgo)

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
  }, [exercises])

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
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 text-center shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all">
            <div className="text-2xl sm:text-3xl mb-2">📊</div>
            <div className="text-xl sm:text-2xl font-bold text-gray-800 mb-1">{stats.totalExercises}</div>
            <div className="text-xs sm:text-sm text-gray-600 font-semibold">Total Sessions</div>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all">
            <div className="text-2xl sm:text-3xl mb-2">💪</div>
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
                ? 'text-purple-600'
                : 'text-gray-600 hover:text-purple-600'
            }`}
          >
            History
            {activeTab === 'history' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('trends')}
            className={`px-6 py-3 font-semibold transition-all relative ${
              activeTab === 'trends'
                ? 'text-purple-600'
                : 'text-gray-600 hover:text-purple-600'
            }`}
          >
            Trends
            {activeTab === 'trends' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full" />
            )}
          </button>
        </div>

        {activeTab === 'history' ? (
          <>
            {/* Filters */}
            <div className="bg-white rounded-2xl p-4 sm:p-6 mb-6 shadow-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-gray-700">Filter by Exercise</label>
                  <select
                    value={filterExerciseType}
                    onChange={(e) => setFilterExerciseType(e.target.value)}
                    className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-600 transition-colors"
                  >
                    <option value="all">All Exercises</option>
                    {exerciseTypes.map(type => (
                      <option key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-gray-700">From Date</label>
                  <input
                    type="date"
                    value={filterDateFrom}
                    onChange={(e) => setFilterDateFrom(e.target.value)}
                    className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-600 transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-gray-700">To Date</label>
                  <input
                    type="date"
                    value={filterDateTo}
                    onChange={(e) => setFilterDateTo(e.target.value)}
                    className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-600 transition-colors"
                  />
                </div>
              </div>
              {(filterExerciseType !== 'all' || filterDateFrom || filterDateTo) && (
                <button
                  onClick={() => {
                    setFilterExerciseType('all')
                    setFilterDateFrom('')
                    setFilterDateTo('')
                  }}
                  className="mt-4 px-4 py-2 text-sm text-purple-600 hover:text-purple-700 font-semibold"
                >
                  Clear Filters
                </button>
              )}
            </div>

            <div className="mt-8">
              {filteredAndSortedExercises.length !== exercises.length && (
                <div className="mb-4 text-sm text-gray-500">
                  Showing {filteredAndSortedExercises.length} of {exercises.length} exercises
                </div>
              )}
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
                  <div className="overflow-x-auto">
                    <table className="w-full table-fixed">
                      <colgroup>
                        <col className="w-[30%]" />
                        <col className="w-[30%]" />
                        <col className="w-[20%]" />
                        <col className="w-[20%]" />
                      </colgroup>
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            onClick={() => handleSort('exercise')}
                            className="px-4 py-4 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors select-none"
                          >
                            <div className="flex items-center gap-2">
                              Exercise
                              {sortColumn === 'exercise' && (
                                <span className="text-purple-600">
                                  {sortDirection === 'asc' ? '↑' : '↓'}
                                </span>
                              )}
                            </div>
                          </th>
                          <th
                            onClick={() => handleSort('date')}
                            className="px-4 py-4 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors select-none"
                          >
                            <div className="flex items-center gap-2">
                              Date
                              {sortColumn === 'date' && (
                                <span className="text-purple-600">
                                  {sortDirection === 'asc' ? '↑' : '↓'}
                                </span>
                              )}
                            </div>
                          </th>
                          <th
                            onClick={() => handleSort('count')}
                            className="px-4 py-4 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors select-none"
                          >
                            <div className="flex items-center gap-2">
                              Reps
                              {sortColumn === 'count' && (
                                <span className="text-purple-600">
                                  {sortDirection === 'asc' ? '↑' : '↓'}
                                </span>
                              )}
                            </div>
                          </th>
                          <th
                            onClick={() => handleSort('duration')}
                            className="px-4 py-4 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors select-none"
                          >
                            <div className="flex items-center gap-2">
                              Duration
                              {sortColumn === 'duration' && (
                                <span className="text-purple-600">
                                  {sortDirection === 'asc' ? '↑' : '↓'}
                                </span>
                              )}
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredAndSortedExercises.map((exercise) => (
                          <tr
                            key={exercise.id}
                            className="hover:bg-purple-50 transition-colors"
                          >
                            <td className="px-4 py-4 text-sm font-medium text-gray-900">
                              <div className="flex items-center gap-2">
                                <span>{exercise.exerciseType === 'pushups' ? '💪' : '🏋️'}</span>
                                <span>{exercise.exerciseType.charAt(0).toUpperCase() + exercise.exerciseType.slice(1)}</span>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-600">
                              {formatDate(exercise.completedAt)}
                            </td>
                            <td className="px-4 py-4 text-sm font-semibold text-purple-600 whitespace-nowrap">
                              {exercise.count.toLocaleString()}
                            </td>
                            <td className="px-4 py-4 text-sm font-semibold text-purple-600 whitespace-nowrap">
                              {formatDuration(exercise.duration)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="mt-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">Exercise Trends</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Daily */}
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h3 className="text-xl font-bold text-gray-800 mb-4">📅 Today</h3>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Sessions</div>
                    <div className="text-2xl font-bold text-purple-600">{trends.daily.count}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Total Reps</div>
                    <div className="text-2xl font-bold text-purple-600">{trends.daily.reps}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Total Duration</div>
                    <div className="text-2xl font-bold text-purple-600">{formatDuration(trends.daily.duration)}</div>
                  </div>
                </div>
              </div>

              {/* Weekly Average */}
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h3 className="text-xl font-bold text-gray-800 mb-4">📊 Weekly Average</h3>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Sessions/Day</div>
                    <div className="text-2xl font-bold text-purple-600">{trends.weekly.count.toFixed(1)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Reps/Day</div>
                    <div className="text-2xl font-bold text-purple-600">{Math.round(trends.weekly.reps)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Duration/Day</div>
                    <div className="text-2xl font-bold text-purple-600">{formatDuration(Math.round(trends.weekly.duration))}</div>
                  </div>
                </div>
              </div>

              {/* Monthly Average */}
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h3 className="text-xl font-bold text-gray-800 mb-4">📈 Monthly Average</h3>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Sessions/Day</div>
                    <div className="text-2xl font-bold text-purple-600">{trends.monthly.count.toFixed(1)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Reps/Day</div>
                    <div className="text-2xl font-bold text-purple-600">{Math.round(trends.monthly.reps)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Duration/Day</div>
                    <div className="text-2xl font-bold text-purple-600">{formatDuration(Math.round(trends.monthly.duration))}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
