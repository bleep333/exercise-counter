'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function AccountPage() {
  const { data: session, update } = useSession()
  const router = useRouter()
  const [profileName, setProfileName] = useState('')
  const [weight, setWeight] = useState<string>('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  useEffect(() => {
    if (!session?.user) {
      router.push('/auth/signin')
      return
    }

    // Fetch current profile data
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/user/profile')
        if (response.ok) {
          const data = await response.json()
          setProfileName(data.profileName || '')
          setWeight(data.weight ? data.weight.toString() : '')
        }
      } catch (err) {
        console.error('Error fetching profile:', err)
      } finally {
        setInitialLoading(false)
      }
    }

    fetchProfile()
  }, [session, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!profileName.trim()) {
      setError('Profile name cannot be empty')
      return
    }

    if (profileName.trim().length < 3) {
      setError('Profile name must be at least 3 characters')
      return
    }

    if (profileName.trim().length > 30) {
      setError('Profile name must be 30 characters or less')
      return
    }

    // Validate weight if provided
    if (weight.trim() && (isNaN(parseFloat(weight)) || parseFloat(weight) <= 0)) {
      setError('Weight must be a positive number')
      return
    }

    setLoading(true)

    try {
      const updateData: { profileName: string; weight?: number | null } = {
        profileName: profileName.trim(),
      }

      if (weight.trim()) {
        updateData.weight = parseFloat(weight)
      } else {
        updateData.weight = null
      }

      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to update profile')
        return
      }

      setSuccess('Profile updated successfully!')
      // Update session to reflect new profile name
      await update()
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!session?.user || initialLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex justify-center items-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex justify-center items-center py-8 px-4">
      <div className="bg-white rounded-3xl p-6 sm:p-8 md:p-12 max-w-md w-full shadow-2xl">
        <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2 text-center">
          Account Settings
        </h1>
        <p className="text-gray-600 text-center mb-6 sm:mb-8 text-sm sm:text-base">
          Manage your account settings
        </p>

        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-yellow-800 font-semibold mb-2">⚠️ Public Visibility</p>
          <p className="text-xs text-yellow-700">
            Your profile name will be visible to everyone on the leaderboard. Choose a name that doesn't reveal personal information.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-center text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 text-center text-sm">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex flex-col gap-2">
            <label htmlFor="profileName" className="font-semibold text-gray-700 text-sm">
              Profile Name <span className="text-red-500">*</span>
            </label>
            <input
              id="profileName"
              type="text"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              required
              minLength={3}
              maxLength={30}
              disabled={loading}
              placeholder="Choose a unique profile name"
              className="px-4 py-3 border-2 border-gray-200 rounded-lg text-base focus:outline-none focus:border-purple-600 transition-colors disabled:bg-gray-50 disabled:cursor-not-allowed"
            />
            <p className="text-xs text-gray-500">
              Must be unique. 3-30 characters. This name will appear on the leaderboard.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="weight" className="font-semibold text-gray-700 text-sm">
              Weight (kg) <span className="text-gray-400 text-xs">(optional)</span>
            </label>
            <input
              id="weight"
              type="number"
              step="0.1"
              min="0"
              max="500"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              disabled={loading}
              placeholder="Enter your weight in kilograms"
              className="px-4 py-3 border-2 border-gray-200 rounded-lg text-base focus:outline-none focus:border-purple-600 transition-colors disabled:bg-gray-50 disabled:cursor-not-allowed"
            />
            <p className="text-xs text-gray-500">
              Your weight is used to calculate calories burned during exercises. Leave empty to hide calorie estimates.
            </p>
          </div>

          <button 
            type="submit" 
            className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold text-base sm:text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 mt-2"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Profile'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600 text-center">
            Email: <span className="font-medium">{session.user.email}</span>
          </p>
        </div>
      </div>
    </div>
  )
}
