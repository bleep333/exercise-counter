'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'

export function NavBar() {
  const pathname = usePathname()
  const { data: session } = useSession()

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-md border-b border-beige-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent hover:scale-105 transition-transform">
            💪 Exercise Counter
          </Link>
          <div className="flex items-center gap-1 sm:gap-4 md:gap-6 overflow-x-auto scrollbar-hide">
            <Link 
              href="/counter" 
              className={`px-2 sm:px-3 py-2 rounded-lg font-semibold text-xs sm:text-sm md:text-base transition-all relative whitespace-nowrap ${
                pathname === '/counter' 
                  ? 'text-purple-600 bg-purple-50' 
                  : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
              }`}
            >
              Counter
              {pathname === '/counter' && (
                <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full" />
              )}
            </Link>
            <Link 
              href="/stats" 
              className={`px-2 sm:px-3 py-2 rounded-lg font-semibold text-xs sm:text-sm md:text-base transition-all relative whitespace-nowrap ${
                pathname === '/stats' 
                  ? 'text-purple-600 bg-purple-50' 
                  : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
              }`}
            >
              Stats
              {pathname === '/stats' && (
                <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full" />
              )}
            </Link>
            <Link 
              href="/goals" 
              className={`px-2 sm:px-3 py-2 rounded-lg font-semibold text-xs sm:text-sm md:text-base transition-all relative whitespace-nowrap ${
                pathname === '/goals' 
                  ? 'text-purple-600 bg-purple-50' 
                  : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
              }`}
            >
              Goals
              {pathname === '/goals' && (
                <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full" />
              )}
            </Link>
            <Link 
              href="/leaderboard" 
              className={`px-2 sm:px-3 py-2 rounded-lg font-semibold text-xs sm:text-sm md:text-base transition-all relative whitespace-nowrap ${
                pathname === '/leaderboard' 
                  ? 'text-purple-600 bg-purple-50' 
                  : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
              }`}
            >
              Leaderboard
              {pathname === '/leaderboard' && (
                <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full" />
              )}
            </Link>
            {session?.user ? (
              <Link
                href="/account"
                className={`ml-2 pl-3 border-l border-gray-200 transition-all ${
                  pathname === '/account'
                    ? 'ring-2 ring-purple-600'
                    : 'hover:opacity-80'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden border-2 border-gray-200 hover:border-purple-400 transition-colors">
                  {session.user.image ? (
                    <img 
                      src={session.user.image} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  )}
                </div>
              </Link>
            ) : (
              <Link 
                href="/auth/signin" 
                className="px-3 py-2 rounded-lg font-semibold text-sm sm:text-base text-gray-600 hover:text-purple-600 hover:bg-purple-50 transition-all"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
