'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignUpPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to create account')
        return
      }

      router.push('/auth/signin?email=' + encodeURIComponent(email))
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex justify-center items-center py-8 px-4">
      <div className="bg-white rounded-3xl p-6 sm:p-8 md:p-12 max-w-md w-full shadow-2xl">
        <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2 text-center">
          Sign Up
        </h1>
        <p className="text-gray-600 text-center mb-6 sm:mb-8 text-sm sm:text-base">
          Create an account to save your stats
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-center text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex flex-col gap-2">
            <label htmlFor="name" className="font-semibold text-gray-700 text-sm">
              Name (optional)
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              className="px-4 py-3 border-2 border-gray-200 rounded-lg text-base focus:outline-none focus:border-purple-600 transition-colors disabled:bg-gray-50 disabled:cursor-not-allowed"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="font-semibold text-gray-700 text-sm">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="px-4 py-3 border-2 border-gray-200 rounded-lg text-base focus:outline-none focus:border-purple-600 transition-colors disabled:bg-gray-50 disabled:cursor-not-allowed"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="font-semibold text-gray-700 text-sm">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              disabled={loading}
              className="px-4 py-3 border-2 border-gray-200 rounded-lg text-base focus:outline-none focus:border-purple-600 transition-colors disabled:bg-gray-50 disabled:cursor-not-allowed"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="confirmPassword" className="font-semibold text-gray-700 text-sm">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
              className="px-4 py-3 border-2 border-gray-200 rounded-lg text-base focus:outline-none focus:border-purple-600 transition-colors disabled:bg-gray-50 disabled:cursor-not-allowed"
            />
          </div>

          <button 
            type="submit" 
            className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold text-base sm:text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 mt-2"
            disabled={loading}
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <p className="text-center mt-6 sm:mt-8 text-gray-600 text-sm sm:text-base">
          Already have an account?{' '}
          <Link href="/auth/signin" className="text-purple-600 font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
