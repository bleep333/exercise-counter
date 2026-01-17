'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

interface LeaderboardEntry {
  profileName: string
  totalCount: number
}

function LeaderboardContent() {
  const searchParams = useSearchParams()
  const [period, setPeriod] = useState<'today' | '7days' | '30days'>(
    (searchParams.get('period') as 'today' | '7days' | '30days') || '30days'
  )
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true)
      setError('')

      try {
        const response = await fetch(`/api/leaderboard?period=${period}&exerciseType=pushups`)
        const data = await response.json()

        if (!response.ok) {
          setError(data.error || 'Failed to load leaderboard')
          return
        }

        setLeaderboard(data.leaderboard || [])
      } catch (err) {
        setError('An error occurred. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchLeaderboard()
  }, [period])

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2 text-center">
            🏆 Leaderboard
          </h1>
          <p className="text-gray-600 text-center mb-6 sm:mb-8 text-sm sm:text-base">
            Most pushups completed
          </p>

          {/* Period selector */}
          <div className="flex justify-center gap-4 mb-8">
            <button
              onClick={() => setPeriod('today')}
              className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                period === 'today'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setPeriod('7days')}
              className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                period === '7days'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Past 7 Days
            </button>
            <button
              onClick={() => setPeriod('30days')}
              className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                period === '30days'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Past 30 Days
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-center text-sm">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Loading leaderboard...</p>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No entries yet. Be the first to complete a workout!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {leaderboard.map((entry, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-4 rounded-lg transition-all ${
                    index === 0
                      ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-2 border-yellow-300'
                      : index === 1
                      ? 'bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-300'
                      : index === 2
                      ? 'bg-gradient-to-r from-orange-50 to-orange-100 border-2 border-orange-300'
                      : 'bg-gray-50 border border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                        index === 0
                          ? 'bg-yellow-400 text-yellow-900'
                          : index === 1
                          ? 'bg-gray-400 text-gray-900'
                          : index === 2
                          ? 'bg-orange-400 text-orange-900'
                          : 'bg-purple-100 text-purple-700'
                      }`}
                    >
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-lg">
                        {entry.profileName}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-purple-600">{entry.totalCount}</p>
                    <p className="text-xs text-gray-500">pushups</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Only users with profile names are shown on the leaderboard. Set your profile name in{' '}
              <a href="/account" className="text-purple-600 hover:underline font-semibold">
                Account Settings
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LeaderboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[calc(100vh-4rem)] flex justify-center items-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    }>
      <LeaderboardContent />
    </Suspense>
  )
}
