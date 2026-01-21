'use client'

import { useEffect, useState, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts'

interface Goal {
  id: string
  exerciseType: string
  targetCount: number
  period: 'day' | 'week' | 'month'
  startDate: string
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
  const [replaceConfirmation, setReplaceConfirmation] = useState<{
    show: boolean
    existingGoal: Goal | null
    newGoalData: { exerciseType: string; targetCount: number; period: string; startDate: string } | null
  }>({
    show: false,
    existingGoal: null,
    newGoalData: null,
  })
  const [formData, setFormData] = useState({
    exerciseType: 'pushups',
    targetCount: 100,
    period: 'week' as 'day' | 'week' | 'month',
    startDate: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
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
    const goalStartDate = new Date(goal.startDate)
    goalStartDate.setHours(0, 0, 0, 0)
    
    // If goal hasn't started yet, return 0
    if (goalStartDate > now) {
      return 0
    }
    
    let streak = 0
    let checkDate = new Date(now)
    let foundIncomplete = false

    // Check periods going backwards until we find an incomplete one or reach startDate
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

      // Stop if we've gone before the goal start date
      if (periodStart < goalStartDate) {
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
    const goalStartDate = new Date(goal.startDate)
    goalStartDate.setHours(0, 0, 0, 0)
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

      // Skip periods before the goal start date
      if (periodStart < goalStartDate) {
        continue
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

  const calculateTimeUntilStart = (goal: Goal): { days: number; weeks: number; months: number; hasStarted: boolean } => {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const goalStartDate = new Date(goal.startDate)
    goalStartDate.setHours(0, 0, 0, 0)
    
    if (goalStartDate <= now) {
      return { days: 0, weeks: 0, months: 0, hasStarted: true }
    }

    const diffTime = goalStartDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    // Calculate months difference
    const yearDiff = goalStartDate.getFullYear() - now.getFullYear()
    const monthDiff = goalStartDate.getMonth() - now.getMonth()
    const totalMonths = yearDiff * 12 + monthDiff
    const adjustedMonths = goalStartDate.getDate() < now.getDate() ? totalMonths - 1 : totalMonths
    
    // Calculate weeks (only if >= 7 days)
    const diffWeeks = diffDays >= 7 ? Math.floor(diffDays / 7) : 0

    return {
      days: diffDays,
      weeks: diffWeeks,
      months: Math.max(0, adjustedMonths),
      hasStarted: false,
    }
  }

  const calculateProgress = (goal: Goal): { current: number; percentage: number } => {
    const now = new Date()
    const goalStartDate = new Date(goal.startDate)
    goalStartDate.setHours(0, 0, 0, 0)
    
    // If goal hasn't started yet, return 0 progress
    if (goalStartDate > now) {
      return { current: 0, percentage: 0 }
    }

    let periodStart: Date

    switch (goal.period) {
      case 'day':
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case 'week':
        periodStart = new Date(now)
        periodStart.setDate(periodStart.getDate() - periodStart.getDay()) // Start of week (Sunday)
        periodStart.setHours(0, 0, 0, 0)
        break
      case 'month':
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
        break
    }

    // Ensure we don't count exercises before the goal start date
    const effectiveStartDate = periodStart > goalStartDate ? periodStart : goalStartDate

    const relevantExercises = exercises.filter(
      ex => ex.exerciseType === goal.exerciseType &&
      new Date(ex.completedAt) >= effectiveStartDate
    )

    const current = relevantExercises.reduce((sum, ex) => sum + ex.count, 0)
    const percentage = Math.min(100, (current / goal.targetCount) * 100)

    return { current, percentage }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    try {
      // First, check if there's an active goal with the same exerciseType and period
      // Exclude the goal being edited from the check
      const existingActiveGoal = goals.find(
        goal => 
          !goal.archived &&
          goal.exerciseType === formData.exerciseType &&
          goal.period === formData.period &&
          (!editingGoal || goal.id !== editingGoal.id) // Exclude the goal being edited
      )

      if (existingActiveGoal && !editingGoal) {
        // Show confirmation modal
        setReplaceConfirmation({
          show: true,
          existingGoal: existingActiveGoal,
          newGoalData: {
            exerciseType: formData.exerciseType,
            targetCount: formData.targetCount,
            period: formData.period,
            startDate: formData.startDate,
          },
        })
        return
      }

      // Proceed with creation/update
      await submitGoal(formData, editingGoal !== null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save goal')
    }
  }

  const submitGoal = async (data: typeof formData, isEdit: boolean, confirmReplace: boolean = false) => {
    try {
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          confirmReplace,
          goalId: editingGoal?.id, // Send goal ID when editing
        }),
      })

      const responseData = await response.json()

      if (!response.ok) {
        // Check if backend also detected an active goal
        if (response.status === 409 && responseData.error === 'ACTIVE_GOAL_EXISTS' && !confirmReplace) {
          const existingActiveGoal = goals.find(
            goal => 
              !goal.archived &&
              goal.exerciseType === data.exerciseType &&
              goal.period === data.period
          )
          
          if (existingActiveGoal) {
            setReplaceConfirmation({
              show: true,
              existingGoal: existingActiveGoal,
              newGoalData: {
                exerciseType: data.exerciseType,
                targetCount: data.targetCount,
                period: data.period,
                startDate: data.startDate,
              },
            })
            return
          }
        }
        throw new Error(responseData.error || 'Failed to save goal')
      }

      await fetchData()
      setShowAddForm(false)
      setEditingGoal(null)
      setReplaceConfirmation({ show: false, existingGoal: null, newGoalData: null })
      setFormData({
        exerciseType: 'pushups',
        targetCount: 100,
        period: 'week',
        startDate: new Date().toISOString().split('T')[0],
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save goal')
    }
  }

  const handleConfirmReplace = async () => {
    if (!replaceConfirmation.newGoalData) return
    
    await submitGoal(
      {
        exerciseType: replaceConfirmation.newGoalData.exerciseType as 'pushups' | 'situps' | 'squats',
        targetCount: replaceConfirmation.newGoalData.targetCount,
        period: replaceConfirmation.newGoalData.period as 'day' | 'week' | 'month',
        startDate: replaceConfirmation.newGoalData.startDate,
      },
      false,
      true // confirmReplace = true
    )
  }

  const handleCancelReplace = () => {
    setReplaceConfirmation({ show: false, existingGoal: null, newGoalData: null })
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
    const startDateStr = goal.startDate ? new Date(goal.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
    setFormData({
      exerciseType: goal.exerciseType,
      targetCount: goal.targetCount,
      period: goal.period,
      startDate: startDateStr,
    })
    setShowAddForm(true)
  }

  // Common exercise types that should always be available
  const commonExerciseTypes = ['pushups', 'situps', 'squats']
  
  // Get all available exercise types from database, combined with common types
  const getAvailableExerciseTypes = useMemo(() => {
    const dbTypes = new Set(exercises.map(ex => ex.exerciseType))
    // Combine database types with common types
    const allTypes = new Set([...commonExerciseTypes, ...dbTypes])
    return Array.from(allTypes).sort()
  }, [exercises])

  const filteredGoals = useMemo(() => {
    return goals.filter(goal => 
      activeTab === 'active' ? !goal.archived : goal.archived
    )
  }, [goals, activeTab])

  // Generate graph data for the selected goal
  const goalGraphData = useMemo(() => {
    if (!selectedGoal) return []

    const goalStartDate = new Date(selectedGoal.startDate)
    goalStartDate.setHours(0, 0, 0, 0)
    
    // For archived goals, use updatedAt as end date if available, otherwise use current date
    // For active goals, use current date
    const endDate = selectedGoal.archived && selectedGoal.updatedAt 
      ? new Date(selectedGoal.updatedAt)
      : new Date()
    endDate.setHours(23, 59, 59, 999)

    // If goal hasn't started yet, return empty array
    if (goalStartDate > endDate) return []

    // Filter exercises for this goal's exercise type within the date range
    const relevantExercises = exercises.filter(
      ex => ex.exerciseType === selectedGoal.exerciseType &&
      new Date(ex.completedAt) >= goalStartDate &&
      new Date(ex.completedAt) <= endDate
    )

    // Helper function to get period start date based on goal period type
    const getPeriodStart = (date: Date): Date => {
      const periodStart = new Date(date)
      switch (selectedGoal.period) {
        case 'day':
          periodStart.setHours(0, 0, 0, 0)
          return periodStart
        case 'week':
          periodStart.setDate(periodStart.getDate() - periodStart.getDay()) // Start of week (Sunday)
          periodStart.setHours(0, 0, 0, 0)
          return periodStart
        case 'month':
          periodStart.setDate(1)
          periodStart.setHours(0, 0, 0, 0)
          return periodStart
      }
    }

    // Helper function to get period key string
    const getPeriodKey = (date: Date): string => {
      const periodStart = getPeriodStart(date)
      switch (selectedGoal.period) {
        case 'day':
          return periodStart.toISOString().split('T')[0] // YYYY-MM-DD
        case 'week':
          return periodStart.toISOString().split('T')[0] // YYYY-MM-DD of week start
        case 'month':
          return `${periodStart.getFullYear()}-${String(periodStart.getMonth() + 1).padStart(2, '0')}` // YYYY-MM
      }
    }

    // Helper function to format display date based on period type
    const formatDisplayDate = (periodStart: Date): string => {
      switch (selectedGoal.period) {
        case 'day':
          return periodStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        case 'week':
          return `Week of ${periodStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
        case 'month':
          return periodStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      }
    }

    // Group exercises by period and sum reps
    const periodMap = new Map<string, number>()
    
    relevantExercises.forEach(ex => {
      const exDate = new Date(ex.completedAt)
      const periodKey = getPeriodKey(exDate)
      const currentReps = periodMap.get(periodKey) || 0
      periodMap.set(periodKey, currentReps + ex.count)
    })

    // Generate data points for all periods from start to end
    const data: Array<{ date: string; displayDate: string; reps: number; target: number }> = []
    // Start from the period that contains the goal start date
    let currentPeriodStart = getPeriodStart(new Date(goalStartDate))

    while (currentPeriodStart <= endDate) {
      const periodKey = getPeriodKey(currentPeriodStart)
      const displayDate = formatDisplayDate(currentPeriodStart)
      const reps = periodMap.get(periodKey) || 0
      
      data.push({
        date: periodKey,
        displayDate,
        reps,
        target: selectedGoal.targetCount
      })

      // Move to next period
      switch (selectedGoal.period) {
        case 'day':
          currentPeriodStart.setDate(currentPeriodStart.getDate() + 1)
          break
        case 'week':
          currentPeriodStart.setDate(currentPeriodStart.getDate() + 7)
          break
        case 'month':
          currentPeriodStart.setMonth(currentPeriodStart.getMonth() + 1)
          break
      }
    }

    return data
  }, [selectedGoal, exercises])

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
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent mb-8 text-center">
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
                  ? 'text-teal-600'
                  : 'text-gray-600 hover:text-teal-600'
              }`}
            >
              Active
              {activeTab === 'active' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-teal-600 to-emerald-600 rounded-full" />
              )}
            </button>
            <button
              onClick={() => {
                setActiveTab('archived')
                setShowAddForm(false)
              }}
              className={`px-6 py-3 font-semibold transition-all relative ${
                activeTab === 'archived'
                  ? 'text-teal-600'
                  : 'text-gray-600 hover:text-teal-600'
              }`}
            >
              Archived
              {activeTab === 'archived' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-teal-600 to-emerald-600 rounded-full" />
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
                    startDate: new Date().toISOString().split('T')[0],
                  })
                }}
                className="px-6 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-lg font-semibold hover:shadow-lg hover:-translate-y-0.5 transition-all"
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
                  className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-teal-600 transition-colors"
                  required
                >
                  {getAvailableExerciseTypes.map(type => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">Period</label>
                <select
                  value={formData.period}
                  onChange={(e) => setFormData({ ...formData, period: e.target.value as 'day' | 'week' | 'month' })}
                  className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-teal-600 transition-colors"
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
                  className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-teal-600 transition-colors"
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">Start Date</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-teal-600 transition-colors"
                  required
                />
                <p className="text-xs text-gray-500">
                  The goal will only track progress from this date onwards. You can set a future date to schedule the goal.
                </p>
              </div>

              <button
                type="submit"
                className="w-full px-6 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-lg font-semibold hover:shadow-lg hover:-translate-y-0.5 transition-all"
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
                className="px-6 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-lg font-semibold hover:shadow-lg hover:-translate-y-0.5 transition-all"
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
              const timeUntilStart = calculateTimeUntilStart(goal)
              const periodLabel = goal.period === 'day' ? 'Daily' : goal.period === 'week' ? 'Weekly' : 'Monthly'
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
                        {periodLabel} target: {goal.targetCount.toLocaleString()} reps
                      </p>
                      {!timeUntilStart.hasStarted && (
                        <p className="text-sm text-blue-600 font-semibold mt-1">
                          {timeUntilStart.months > 0 
                            ? `⏰ ${timeUntilStart.months} ${timeUntilStart.months === 1 ? 'month' : 'months'} to start`
                            : timeUntilStart.days >= 7
                            ? `⏰ ${timeUntilStart.weeks} ${timeUntilStart.weeks === 1 ? 'week' : 'weeks'} to start`
                            : `⏰ ${timeUntilStart.days} ${timeUntilStart.days === 1 ? 'day' : 'days'} to start`}
                        </p>
                      )}
                      {timeUntilStart.hasStarted && streak > 0 && (
                        <p className="text-sm text-teal-600 font-semibold mt-1">
                          🔥 {streak} {periodSingular} streak
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      {!goal.archived && (
                        <button
                          onClick={() => handleEdit(goal)}
                          className="px-4 py-2 text-sm font-semibold text-teal-600 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors"
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

                  {timeUntilStart.hasStarted ? (
                    <>
                      <div className="mb-2">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-semibold text-gray-700">Progress</span>
                          <span className="text-sm font-bold text-teal-600">
                            {progress.current.toLocaleString()} / {goal.targetCount.toLocaleString()} reps
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              progress.percentage >= 100
                                ? 'bg-gradient-to-r from-green-500 to-green-600'
                                : progress.percentage >= 75
                                ? 'bg-gradient-to-r from-teal-600 to-emerald-600'
                                : progress.percentage >= 50
                                ? 'bg-gradient-to-r from-cyan-500 to-teal-600'
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
                    </>
                  ) : (
                    <div className="mb-2">
                      <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
                        <div className="h-full rounded-full bg-gray-300" style={{ width: '0%' }} />
                      </div>
                      <div className="text-sm text-gray-500 mt-2 text-center">
                        Goal starts on {new Date(goal.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>
                  )}
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
              className="bg-white rounded-2xl p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto shadow-2xl"
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
                {(() => {
                  const timeUntilStart = calculateTimeUntilStart(selectedGoal)
                  if (!timeUntilStart.hasStarted) {
                    return (
                      <p className="text-sm text-blue-600 font-semibold mt-1">
                        {timeUntilStart.months > 0 
                          ? `⏰ ${timeUntilStart.months} ${timeUntilStart.months === 1 ? 'month' : 'months'} to start`
                          : timeUntilStart.days >= 7
                          ? `⏰ ${timeUntilStart.weeks} ${timeUntilStart.weeks === 1 ? 'week' : 'weeks'} to start`
                          : `⏰ ${timeUntilStart.days} ${timeUntilStart.days === 1 ? 'day' : 'days'} to start`}
                      </p>
                    )
                  }
                  const streak = calculateStreak(selectedGoal)
                  if (streak > 0) {
                    return (
                      <p className="text-sm text-teal-600 font-semibold mt-1">
                        🔥 Current streak: {streak} {selectedGoal.period === 'day' ? 'day' : selectedGoal.period === 'week' ? 'week' : 'month'}(s)
                      </p>
                    )
                  }
                  return null
                })()}
              </div>

              {(() => {
                const timeUntilStart = calculateTimeUntilStart(selectedGoal)
                if (!timeUntilStart.hasStarted) {
                  return (
                    <div className="text-center py-8 text-gray-500">
                      <p className="text-lg font-semibold mb-2">Goal hasn't started yet</p>
                      <p className="text-sm">
                        This goal will begin tracking on {new Date(selectedGoal.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  )
                }

                // Show graph if we have data
                const showGraph = goalGraphData.length > 0

                const history = getGoalHistory(selectedGoal)
                if (history.length === 0) {
                  return (
                    <div className="text-center py-8 text-gray-500">
                      <p>No history available yet</p>
                    </div>
                  )
                }
                return (
                  <div className="space-y-6">
                    {/* Goal Progress Graph */}
                    {showGraph && (
                      <div className="bg-gray-50 rounded-xl p-4">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">
                          {selectedGoal.period === 'day' ? 'Daily' : selectedGoal.period === 'week' ? 'Weekly' : 'Monthly'} Progress vs Goal
                        </h3>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={goalGraphData} margin={{ top: 5, right: 30, left: 20, bottom: 80 }} barCategoryGap="20%">
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis 
                              dataKey="displayDate" 
                              stroke="#6b7280"
                              style={{ fontSize: '12px' }}
                              angle={-45}
                              textAnchor="end"
                              height={80}
                              interval={
                                goalGraphData.length > 30 
                                  ? Math.floor(goalGraphData.length / 15) 
                                  : selectedGoal.period === 'month' && goalGraphData.length > 12
                                  ? Math.floor(goalGraphData.length / 12)
                                  : 0
                              }
                            />
                            <YAxis 
                              label={{ value: 'Reps', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#6b7280' } }}
                              stroke="#6b7280"
                              style={{ fontSize: '12px' }}
                              domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.4)]}
                            />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: 'white', 
                                border: '1px solid #e5e7eb', 
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                              }}
                              labelStyle={{ color: '#374151', fontWeight: 'bold' }}
                              content={({ active, payload, label }) => {
                                if (!active || !payload || !payload.length) return null
                                
                                // Filter out the target entry, only show reps
                                const repsEntry = payload.find(entry => entry.dataKey === 'reps')
                                if (!repsEntry) return null
                                
                                return (
                                  <div style={{
                                    backgroundColor: 'white',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    padding: '12px',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                  }}>
                                    <p style={{ color: '#374151', fontWeight: 'bold', marginBottom: '8px' }}>
                                      {label}
                                    </p>
                                    <p style={{ color: '#14b8a6', margin: 0 }}>
                                      Reps: {typeof repsEntry.value === 'number' ? repsEntry.value.toLocaleString() : '0'}
                                    </p>
                                  </div>
                                )
                              }}
                            />
                            <Legend />
                            <Bar 
                              dataKey="reps" 
                              fill="#14b8a6" 
                              name="Actual Reps"
                              radius={[4, 4, 0, 0]}
                              barSize={40}
                              activeBar={{ 
                                fill: "#0d9488", 
                                stroke: "#14b8a6",
                                strokeWidth: 2
                              }}
                            />
                            <ReferenceLine 
                              y={selectedGoal.targetCount} 
                              stroke="#ef4444" 
                              strokeWidth={2}
                              strokeDasharray="5 5"
                              label={{ value: "Goal Target", position: "right", fill: "#ef4444", fontSize: 12 }}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    {/* Period History Table */}
                    <div className="space-y-2">
                      <h3 className="text-lg font-bold text-gray-800 mb-2">Period History</h3>
                      <div className="grid grid-cols-4 gap-2 font-semibold text-sm text-gray-700 pb-2 border-b">
                        <div>Period</div>
                        <div className="text-center">Status</div>
                        <div className="text-center">Reps</div>
                        <div className="text-center">Target</div>
                      </div>
                      {history.map((entry, index) => (
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
                )
              })()}
            </div>
          </div>
        )}

        {/* Replace Goal Confirmation Modal */}
        {replaceConfirmation.show && replaceConfirmation.existingGoal && replaceConfirmation.newGoalData && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={handleCancelReplace}
          >
            <div 
              className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Replace existing goal?
              </h2>
              
              <p className="text-gray-600 mb-6">
                You already have an active {replaceConfirmation.existingGoal.period === 'day' ? 'Daily' : replaceConfirmation.existingGoal.period === 'week' ? 'Weekly' : 'Monthly'} {replaceConfirmation.existingGoal.exerciseType.charAt(0).toUpperCase() + replaceConfirmation.existingGoal.exerciseType.slice(1)} goal ({replaceConfirmation.existingGoal.targetCount.toLocaleString()} reps).
                <br /><br />
                Replacing it will archive the existing goal and create a new one with {replaceConfirmation.newGoalData.targetCount.toLocaleString()} reps.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={handleCancelReplace}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmReplace}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
                >
                  Replace Goal
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
