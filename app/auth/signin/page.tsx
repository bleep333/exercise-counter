'use client'

import { useState, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

function SignInForm() {
  const router = useRouter()
  const [email] = useState('user@counter.com')
  const [password] = useState('user123')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid email or password')
      } else {
        router.push('/stats')
        router.refresh()
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex justify-center items-center py-8 px-4">
      <div className="bg-white rounded-3xl p-6 sm:p-8 md:p-12 max-w-md w-full shadow-2xl">
        <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent mb-2 text-center">
          Sign In
        </h1>
        <p className="text-gray-600 text-center mb-6 sm:mb-8 text-sm sm:text-base">
          Sign in to your account to sync your stats
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-center text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="font-semibold text-gray-700 text-sm">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              readOnly
              required
              disabled={loading}
              className="px-4 py-3 border-2 border-gray-200 rounded-lg text-base focus:outline-none focus:border-teal-600 transition-colors disabled:bg-gray-50 disabled:cursor-not-allowed"
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
              readOnly
              required
              disabled={loading}
              className="px-4 py-3 border-2 border-gray-200 rounded-lg text-base focus:outline-none focus:border-teal-600 transition-colors disabled:bg-gray-50 disabled:cursor-not-allowed"
            />
          </div>

          <button 
            type="submit" 
            className="w-full px-6 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-lg font-semibold text-base sm:text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 mt-2"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center mt-6 sm:mt-8 text-gray-600 text-sm sm:text-base">
          Don't have an account?{' '}
          <Link href="/auth/signup" className="text-teal-600 font-semibold hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[calc(100vh-4rem)] flex justify-center items-center py-8 px-4">
        <div className="bg-white rounded-3xl p-6 sm:p-8 md:p-12 max-w-md w-full shadow-2xl">
          <p className="text-gray-600 text-center">Loading...</p>
        </div>
      </div>
    }>
      <SignInForm />
    </Suspense>
  )
}
