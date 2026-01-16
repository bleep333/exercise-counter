'use client'

import { useEffect, useState, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface Goal {
  id: string
  exerciseType: string
  targetCount: number
  period: 'day' | 'week' | 'month'
  createdAt: string
  updatedAt: string
}

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

        <div className="flex justify-end mb-6">
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

        {showAddForm && (
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

        {goals.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 sm:p-12 text-center shadow-lg">
            <p className="text-lg sm:text-xl text-gray-600 mb-2">No goals set yet.</p>
            <p className="text-base text-gray-500 mb-4">
              Create a goal to track your progress and stay motivated!
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              Create Your First Goal
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {goals.map((goal) => {
              const progress = calculateProgress(goal)
              const periodLabel = goal.period === 'day' ? 'Today' : goal.period === 'week' ? 'This Week' : 'This Month'
              
              return (
                <div key={goal.id} className="bg-white rounded-2xl p-6 shadow-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
                    <div>
                      <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1">
                        {goal.exerciseType.charAt(0).toUpperCase() + goal.exerciseType.slice(1)}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {periodLabel} • Target: {goal.targetCount.toLocaleString()} reps
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(goal)}
                        className="px-4 py-2 text-sm font-semibold text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                      >
                        Edit
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
      </div>
    </div>
  )
}
