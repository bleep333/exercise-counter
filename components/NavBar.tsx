'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useState, useEffect, useRef } from 'react'

export function NavBar() {
  const pathname = usePathname()
  const { data: session } = useSession()

  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-md border-b border-beige-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link
            href="/"
            className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"
          >
            💪 Exercise Counter
          </Link>

          {/* Links */}
          <div className="flex items-center gap-4">
            {[
              ['/counter', 'Counter'],
              ['/stats', 'Stats'],
              ['/goals', 'Goals'],
              ['/leaderboard', 'Leaderboard'],
            ].map(([href, label]) => (
              <Link
                key={href}
                href={href}
                className={`px-3 py-2 rounded-lg font-semibold text-sm transition ${
                  pathname === href
                    ? 'text-purple-600 bg-purple-50'
                    : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
                }`}
              >
                {label}
              </Link>
            ))}

            {/* Separator + Profile / Auth */}
            <div className="ml-3 pl-3 border-l border-gray-200 h-8 flex items-center">
              {session?.user ? (
                <div className="relative" ref={dropdownRef}>
                  {/* Avatar button */}
                  <button
                    type="button"
                    onClick={() => setOpen((v) => !v)}
                    className="w-10 h-10 rounded-full border-2 border-gray-300 overflow-hidden hover:border-purple-500"
                  >
                    {session.user.image ? (
                      <img
                        src={session.user.image}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <svg
                        className="w-6 h-6 mx-auto mt-2 text-gray-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    )}
                  </button>

                  {/* Dropdown */}
                  {open && (
                    <div className="absolute right-0 mt-2 w-44 bg-white border rounded-lg shadow-lg z-50">
                      <Link
                        href="/account"
                        onClick={() => setOpen(false)}
                        className="block px-4 py-2 text-sm hover:bg-purple-50"
                      >
                        Profile
                      </Link>

                      <button
                        onClick={() => signOut({ callbackUrl: '/' })}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/auth/signin"
                  className="px-3 py-2 rounded-lg font-semibold text-sm text-gray-600 hover:text-purple-600 hover:bg-purple-50"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}