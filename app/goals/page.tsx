'use client'

import { useEffect, useState, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface Goal {
  id: string
  exerciseType: string
  targetCount: number
  period: 'day' | 'week' | 'month'
  archived: boolean
  createdAt: string
  updatedAt: string
}

type TabType = 'active' | 'archived'

interface Exercise {
  id: string
  exerciseType: string
  count: number
  duration: number
  completedAt: string
  createdAt: string
}

export default function GoalsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [goals, setGoals] = useState<Goal[]>([])
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('active')
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null)
  const [formData, setFormData] = useState({
    exerciseType: 'pushups',
    targetCount: 100,
    period: 'week' as 'day' | 'week' | 'month',
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }
    if (status === 'authenticated') {
      fetchData()
    }
  }, [status, router])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [goalsRes, exercisesRes] = await Promise.all([
        fetch('/api/goals'),
        fetch('/api/exercises'),
      ])

      if (!goalsRes.ok || !exercisesRes.ok) {
        throw new Error('Failed to fetch data')
      }

      const goalsData = await goalsRes.json()
      const exercisesData = await exercisesRes.json()

      setGoals(goalsData.goals || [])
      setExercises(exercisesData.exercises || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load goals')
    } finally {
      setLoading(false)
    }
  }

  const calculateStreak = (goal: Goal): number => {
    const now = new Date()
    let streak = 0
    let checkDate = new Date(now)
    let foundIncomplete = false

    // Check periods going backwards until we find an incomplete one
    while (!foundIncomplete) {
      let periodStart: Date
      let periodEnd: Date

      switch (goal.period) {
        case 'day':
          periodStart = new Date(checkDate.getFullYear(), checkDate.getMonth(), checkDate.getDate())
          periodEnd = new Date(periodStart)
          periodEnd.setDate(periodEnd.getDate() + 1)
          break
        case 'week':
          periodStart = new Date(checkDate)
          periodStart.setDate(periodStart.getDate() - periodStart.getDay()) // Start of week (Sunday)
          periodStart.setHours(0, 0, 0, 0)
          periodEnd = new Date(periodStart)
          periodEnd.setDate(periodEnd.getDate() + 7)
          break
        case 'month':
          periodStart = new Date(checkDate.getFullYear(), checkDate.getMonth(), 1)
          periodEnd = new Date(checkDate.getFullYear(), checkDate.getMonth() + 1, 1)
          break
      }

      const periodExercises = exercises.filter(
        ex => ex.exerciseType === goal.exerciseType &&
        new Date(ex.completedAt) >= periodStart &&
        new Date(ex.completedAt) < periodEnd
      )

      const totalCount = periodExercises.reduce((sum, ex) => sum + ex.count, 0)

      if (totalCount >= goal.targetCount) {
        streak++
        // Move to previous period
        switch (goal.period) {
          case 'day':
            checkDate.setDate(checkDate.getDate() - 1)
            break
          case 'week':
            checkDate.setDate(checkDate.getDate() - 7)
            break
          case 'month':
            checkDate.setMonth(checkDate.getMonth() - 1)
            break
        }
      } else {
        foundIncomplete = true
      }
    }

    return streak
  }

  const getGoalHistory = (goal: Goal, periodsToShow: number = 10) => {
    const now = new Date()
    const history: Array<{ period: string; completed: boolean; count: number; target: number }> = []

    for (let i = 0; i < periodsToShow; i++) {
      let periodStart: Date
      let periodEnd: Date
      let periodLabel: string

      switch (goal.period) {
        case 'day':
          const dayDate = new Date(now)
          dayDate.setDate(dayDate.getDate() - i)
          periodStart = new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate())
          periodEnd = new Date(periodStart)
          periodEnd.setDate(periodEnd.getDate() + 1)
          periodLabel = periodStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          break
        case 'week':
          const weekDate = new Date(now)
          weekDate.setDate(weekDate.getDate() - (i * 7))
          periodStart = new Date(weekDate)
          periodStart.setDate(periodStart.getDate() - periodStart.getDay())
          periodStart.setHours(0, 0, 0, 0)
          periodEnd = new Date(periodStart)
          periodEnd.setDate(periodEnd.getDate() + 7)
          periodLabel = `Week of ${periodStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
          break
        case 'month':
          const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
          periodStart = new Date(monthDate)
          periodEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1)
          periodLabel = periodStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
          break
      }

      const periodExercises = exercises.filter(
        ex => ex.exerciseType === goal.exerciseType &&
        new Date(ex.completedAt) >= periodStart &&
        new Date(ex.completedAt) < periodEnd
      )

      const count = periodExercises.reduce((sum, ex) => sum + ex.count, 0)
      const completed = count >= goal.targetCount

      history.push({
        period: periodLabel,
        completed,
        count,
        target: goal.targetCount,
      })
    }

    return history // Show most recent first
  }

  const handleArchive = async (goalId: string, archive: boolean) => {
    try {
      const response = await fetch(`/api/goals?id=${goalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived: archive }),
      })

      if (!response.ok) {
        throw new Error('Failed to archive goal')
      }

      await fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to archive goal')
    }
  }

  const calculateProgress = (goal: Goal): { current: number; percentage: number } => {
    const now = new Date()
    let startDate: Date

    switch (goal.period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case 'week':
        startDate = new Date(now)
        startDate.setDate(startDate.getDate() - startDate.getDay()) // Start of week (Sunday)
        startDate.setHours(0, 0, 0, 0)
        break
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
    }

    const relevantExercises = exercises.filter(
      ex => ex.exerciseType === goal.exerciseType &&
      new Date(ex.completedAt) >= startDate
    )

    const current = relevantExercises.reduce((sum, ex) => sum + ex.count, 0)
    const percentage = Math.min(100, (current / goal.targetCount) * 100)

    return { current, percentage }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    try {
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save goal')
      }

      await fetchData()
      setShowAddForm(false)
      setEditingGoal(null)
      setFormData({
        exerciseType: 'pushups',
        targetCount: 100,
        period: 'week',
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save goal')
    }
  }

  const handleDelete = async (goalId: string) => {
    if (!confirm('Are you sure you want to delete this goal?')) {
      return
    }

    try {
      const response = await fetch(`/api/goals?id=${goalId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete goal')
      }

      await fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete goal')
    }
  }

  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal)
    setFormData({
      exerciseType: goal.exerciseType,
      targetCount: goal.targetCount,
      period: goal.period,
    })
    setShowAddForm(true)
  }

  const getExerciseTypes = () => {
    const types = new Set(exercises.map(ex => ex.exerciseType))
    return Array.from(types).sort()
  }

  const filteredGoals = useMemo(() => {
    return goals.filter(goal => 
      activeTab === 'active' ? !goal.archived : goal.archived
    )
  }, [goals, activeTab])

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
        <div className="text-xl text-gray-600">Loading goals...</div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 sm:py-12 px-4 sm:px-6 lg:px-8 flex justify-center">
      <div className="max-w-4xl w-full">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-8 text-center">
          Exercise Goals
        </h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex gap-2 border-b border-gray-200" style={{ minHeight: '3.5rem' }}>
            <button
              onClick={() => {
                setActiveTab('active')
                setShowAddForm(false)
              }}
              className={`px-6 py-3 font-semibold transition-all relative ${
                activeTab === 'active'
                  ? 'text-purple-600'
                  : 'text-gray-600 hover:text-purple-600'
              }`}
            >
              Active
              {activeTab === 'active' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full" />
              )}
            </button>
            <button
              onClick={() => {
                setActiveTab('archived')
                setShowAddForm(false)
              }}
              className={`px-6 py-3 font-semibold transition-all relative ${
                activeTab === 'archived'
                  ? 'text-purple-600'
                  : 'text-gray-600 hover:text-purple-600'
              }`}
            >
              Archived
              {activeTab === 'archived' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full" />
              )}
            </button>
          </div>
          {activeTab === 'active' && (
            <div className="flex justify-end mt-4">
              <button
                onClick={() => {
                  setShowAddForm(!showAddForm)
                  setEditingGoal(null)
                  setFormData({
                    exerciseType: 'pushups',
                    targetCount: 100,
                    period: 'week',
                  })
                }}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg hover:-translate-y-0.5 transition-all"
              >
                {showAddForm ? 'Cancel' : '+ Add Goal'}
              </button>
            </div>
          )}
        </div>

        {showAddForm && activeTab === 'active' && (
          <div className="bg-white rounded-2xl p-6 mb-8 shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              {editingGoal ? 'Edit Goal' : 'Create New Goal'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">Exercise Type</label>
                <select
                  value={formData.exerciseType}
                  onChange={(e) => setFormData({ ...formData, exerciseType: e.target.value })}
                  className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-600 transition-colors"
                  required
                >
                  {getExerciseTypes().length > 0 ? (
                    getExerciseTypes().map(type => (
                      <option key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="pushups">Pushups</option>
                      <option value="situps">Situps</option>
                      <option value="squats">Squats</option>
                    </>
                  )}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">Period</label>
                <select
                  value={formData.period}
                  onChange={(e) => setFormData({ ...formData, period: e.target.value as 'day' | 'week' | 'month' })}
                  className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-600 transition-colors"
                  required
                >
                  <option value="day">Daily</option>
                  <option value="week">Weekly</option>
                  <option value="month">Monthly</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">Target Count</label>
                <input
                  type="number"
                  min="1"
                  value={formData.targetCount}
                  onChange={(e) => setFormData({ ...formData, targetCount: parseInt(e.target.value) || 0 })}
                  className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-600 transition-colors"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg hover:-translate-y-0.5 transition-all"
              >
                {editingGoal ? 'Update Goal' : 'Create Goal'}
              </button>
            </form>
          </div>
        )}


        {filteredGoals.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 sm:p-12 text-center shadow-lg">
            <p className="text-lg sm:text-xl text-gray-600 mb-2">
              {activeTab === 'active' ? 'No active goals.' : 'No archived goals.'}
            </p>
            <p className="text-base text-gray-500 mb-4">
              {activeTab === 'active' 
                ? 'Create a goal to track your progress and stay motivated!'
                : 'Archived goals will appear here.'}
            </p>
            {activeTab === 'active' && (
              <button
                onClick={() => setShowAddForm(true)}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg hover:-translate-y-0.5 transition-all"
              >
                Create Your First Goal
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {filteredGoals.map((goal) => {
              const progress = calculateProgress(goal)
              const streak = calculateStreak(goal)
              const periodLabel = goal.period === 'day' ? 'Today' : goal.period === 'week' ? 'This Week' : 'This Month'
              const periodSingular = goal.period === 'day' ? 'day' : goal.period === 'week' ? 'week' : 'month'
              
              return (
                <div 
                  key={goal.id} 
                  className="bg-white rounded-2xl p-6 shadow-lg cursor-pointer hover:shadow-xl transition-all"
                  onClick={() => setSelectedGoal(goal)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
                    <div className="flex-1">
                      <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1">
                        {goal.exerciseType.charAt(0).toUpperCase() + goal.exerciseType.slice(1)}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {periodLabel} • Target: {goal.targetCount.toLocaleString()} reps
                      </p>
                      {streak > 0 && (
                        <p className="text-sm text-purple-600 font-semibold mt-1">
                          🔥 {streak} {periodSingular} streak
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      {!goal.archived && (
                        <button
                          onClick={() => handleEdit(goal)}
                          className="px-4 py-2 text-sm font-semibold text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                        >
                          Edit
                        </button>
                      )}
                      <button
                        onClick={() => handleArchive(goal.id, !goal.archived)}
                        className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        {goal.archived ? 'Unarchive' : 'Archive'}
                      </button>
                      <button
                        onClick={() => handleDelete(goal.id)}
                        className="px-4 py-2 text-sm font-semibold text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="mb-2">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold text-gray-700">Progress</span>
                      <span className="text-sm font-bold text-purple-600">
                        {progress.current.toLocaleString()} / {goal.targetCount.toLocaleString()} reps
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          progress.percentage >= 100
                            ? 'bg-gradient-to-r from-green-500 to-green-600'
                            : progress.percentage >= 75
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600'
                            : progress.percentage >= 50
                            ? 'bg-gradient-to-r from-blue-500 to-purple-600'
                            : 'bg-gradient-to-r from-yellow-400 to-orange-500'
                        }`}
                        style={{ width: `${progress.percentage}%` }}
                      />
                    </div>
                  </div>

                  <div className="text-sm text-gray-600 mt-2">
                    {progress.percentage >= 100 ? (
                      <span className="text-green-600 font-semibold">🎉 Goal achieved!</span>
                    ) : (
                      <span>
                        {Math.ceil(goal.targetCount - progress.current).toLocaleString()} reps remaining
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Goal History Modal */}
        {selectedGoal && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedGoal(null)}
          >
            <div 
              className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">
                  {selectedGoal.exerciseType.charAt(0).toUpperCase() + selectedGoal.exerciseType.slice(1)} Goal History
                </h2>
                <button
                  onClick={() => setSelectedGoal(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ×
                </button>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  Target: {selectedGoal.targetCount.toLocaleString()} reps per {selectedGoal.period === 'day' ? 'day' : selectedGoal.period === 'week' ? 'week' : 'month'}
                </p>
                {calculateStreak(selectedGoal) > 0 && (
                  <p className="text-sm text-purple-600 font-semibold mt-1">
                    🔥 Current streak: {calculateStreak(selectedGoal)} {selectedGoal.period === 'day' ? 'day' : selectedGoal.period === 'week' ? 'week' : 'month'}(s)
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="grid grid-cols-4 gap-2 font-semibold text-sm text-gray-700 pb-2 border-b">
                  <div>Period</div>
                  <div className="text-center">Status</div>
                  <div className="text-center">Reps</div>
                  <div className="text-center">Target</div>
                </div>
                {getGoalHistory(selectedGoal).map((entry, index) => (
                  <div 
                    key={index} 
                    className={`grid grid-cols-4 gap-2 text-sm py-2 rounded ${
                      entry.completed ? 'bg-green-50' : 'bg-gray-50'
                    }`}
                  >
                    <div className="font-medium">{entry.period}</div>
                    <div className="text-center">
                      {entry.completed ? (
                        <span className="text-green-600 font-semibold">✓ Completed</span>
                      ) : (
                        <span className="text-gray-500">Not met</span>
                      )}
                    </div>
                    <div className="text-center font-semibold">{entry.count.toLocaleString()}</div>
                    <div className="text-center text-gray-600">{entry.target.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
