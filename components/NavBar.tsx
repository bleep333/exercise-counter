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
          <div className="flex items-center gap-4 sm:gap-6">
            <Link 
              href="/counter" 
              className={`px-3 py-2 rounded-lg font-semibold text-sm sm:text-base transition-all relative ${
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
              className={`px-3 py-2 rounded-lg font-semibold text-sm sm:text-base transition-all relative ${
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
              className={`px-3 py-2 rounded-lg font-semibold text-sm sm:text-base transition-all relative ${
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
              className={`px-3 py-2 rounded-lg font-semibold text-sm sm:text-base transition-all relative ${
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
              <div className="flex items-center gap-3 ml-2 pl-3 border-l border-gray-200">
                <span className="text-sm text-gray-600 font-medium hidden sm:inline">
                  {session.user.name || session.user.email}
                </span>
                <Link
                  href="/account"
                  className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors ${
                    pathname === '/account'
                      ? 'text-purple-600 bg-purple-100'
                      : 'text-purple-600 bg-purple-50 hover:bg-purple-100'
                  }`}
                >
                  Account
                </Link>
                <button 
                  onClick={() => signOut()} 
                  className="px-3 py-1.5 text-sm font-semibold text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                >
                  Sign Out
                </button>
              </div>
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
