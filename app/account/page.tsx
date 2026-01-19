'use client'

import { useState, useEffect, type FormEvent } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function AccountPage() {
  const { data: session, update } = useSession()
  const router = useRouter()

  const [profileName, setProfileName] = useState('')
  const [weight, setWeight] = useState<string>('')
  const [leaderboardVisible, setLeaderboardVisible] = useState(true)

  // Store original values to detect changes
  const [originalProfileName, setOriginalProfileName] = useState('')
  const [originalWeight, setOriginalWeight] = useState<string>('')
  const [originalLeaderboardVisible, setOriginalLeaderboardVisible] = useState(true)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  useEffect(() => {
    if (!session?.user) {
      router.push('/auth/signin')
      return
    }

    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/user/profile')
        if (response.ok) {
          const data = await response.json()
          const profileNameValue = data.profileName || ''
          const weightValue = data.weight ? data.weight.toString() : ''
          const leaderboardVisibleValue = data.leaderboardVisible !== undefined ? data.leaderboardVisible : true
          
          setProfileName(profileNameValue)
          setWeight(weightValue)
          setLeaderboardVisible(leaderboardVisibleValue)
          
          // Store original values
          setOriginalProfileName(profileNameValue)
          setOriginalWeight(weightValue)
          setOriginalLeaderboardVisible(leaderboardVisibleValue)
        }
      } catch (err) {
        console.error('Error fetching profile:', err)
      } finally {
        setInitialLoading(false)
      }
    }

    fetchProfile()
  }, [session, router])

  const handleSubmit = async (e: FormEvent) => {
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

    if (weight.trim() && (isNaN(parseFloat(weight)) || parseFloat(weight) <= 0)) {
      setError('Weight must be a positive number')
      return
    }

    setLoading(true)

    try {
      const updateData: {
        profileName: string
        weight?: number | null
        leaderboardVisible?: boolean
      } = {
        profileName: profileName.trim(),
        leaderboardVisible,
      }

      updateData.weight = weight.trim() ? parseFloat(weight) : null

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
      
      // Update original values after successful save
      setOriginalProfileName(profileName.trim())
      setOriginalWeight(weight.trim())
      setOriginalLeaderboardVisible(leaderboardVisible)
      
      await update()
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Check if there are any changes
  const hasChanges = () => {
    const profileNameChanged = profileName.trim() !== originalProfileName.trim()
    const weightChanged = (weight.trim() || '') !== (originalWeight.trim() || '')
    const leaderboardVisibleChanged = leaderboardVisible !== originalLeaderboardVisible
    
    return profileNameChanged || weightChanged || leaderboardVisibleChanged
  }

  if (!session?.user || initialLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex justify-center items-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent mb-8 text-center">
          Profile Settings
        </h1>

        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Account Information</h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
              <div className="px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg text-gray-600">
                {session.user.email}
              </div>
              <p className="text-xs text-gray-500 mt-1">Your email address cannot be changed</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Profile</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 text-sm">
              {success}
            </div>
          )}

          {hasChanges() && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg mb-6 text-sm">
              You have unsaved changes. Click "Save Changes" to apply them.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col gap-2">
              <label htmlFor="profileName" className="font-semibold text-gray-700 text-sm">
                Profile Name <span className="text-red-500">*</span>
              </label>
              <input
                id="profileName"
                type="text"
                value={profileName}
                onChange={(e) => {
                  setProfileName(e.target.value)
                  setSuccess('') // Clear success message when changes are made
                }}
                required
                minLength={3}
                maxLength={30}
                disabled={loading}
                placeholder="Choose a unique profile name"
                className="px-4 py-3 border-2 border-gray-200 rounded-lg text-base focus:outline-none focus:border-teal-600 transition-colors disabled:bg-gray-50 disabled:cursor-not-allowed"
              />
              <p className="text-xs text-gray-500">
                Must be unique. 3-30 characters. This name will appear on the leaderboard if visibility is enabled.
              </p>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
              <div className="flex-1">
                <label htmlFor="leaderboardVisible" className="block text-sm font-semibold text-gray-700 mb-1">
                  Show on Leaderboard
                </label>
                <p className="text-xs text-gray-500">
                  When enabled, your profile name and stats will be visible on the public leaderboard
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setError('')
                  setSuccess('') // Clear success message when changes are made
                  setLeaderboardVisible(!leaderboardVisible)
                }}
                disabled={loading}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2 disabled:opacity-50 ${
                  leaderboardVisible ? 'bg-teal-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    leaderboardVisible ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="weight" className="font-semibold text-gray-700 text-sm">
                Weight (kg) <span className="text-gray-400 text-xs">(optional)</span>
              </label>
              <input
                id="weight"
                type="number"
                step="1"
                min="0"
                max="999"
                maxLength={3}
                value={weight}
                onChange={(e) => {
                  const value = e.target.value
                  // Only allow whole numbers (no decimals) and max 3 digits
                  if (value === '' || (/^\d+$/.test(value) && value.length <= 3)) {
                    setWeight(value)
                    setSuccess('') // Clear success message when changes are made
                  }
                }}
                onKeyDown={(e) => {
                  // Prevent decimal point, minus, plus, and 'e' keys
                  if (e.key === '.' || e.key === '-' || e.key === '+' || e.key === 'e' || e.key === 'E') {
                    e.preventDefault()
                  }
                }}
                disabled={loading}
                placeholder="Enter your weight in kilograms"
                className="px-4 py-3 border-2 border-gray-200 rounded-lg text-base focus:outline-none focus:border-teal-600 transition-colors disabled:bg-gray-50 disabled:cursor-not-allowed"
              />
              <p className="text-xs text-gray-500">
                Your weight is used to calculate calories burned during exercises. Leave empty to hide calorie estimates.
              </p>
            </div>

            <button
              type="submit"
              className="w-full px-6 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-lg font-semibold text-base sm:text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              disabled={loading || !hasChanges()}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}