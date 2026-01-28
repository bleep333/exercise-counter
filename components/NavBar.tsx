'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useState, useEffect, useRef } from 'react'

export function NavBar() {
  const pathname = usePathname()
  const { data: session, status } = useSession()

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
    <nav className="sticky top-0 z-50 bg-emerald-50/80 backdrop-blur-md border-b border-emerald-200/60 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2"
          >
            <Image
              src="/logo.svg"
              alt="CleanReps"
              width={48}
              height={48}
              className="h-12 w-auto"
              priority
            />
            <span className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
              CleanReps
            </span>
          </Link>

          {/* Links */}
          <div className="flex items-center">
            {[
              ['/counter', 'Train'],
              ['/goals', 'Goals'],
              ['/stats', 'Workout History'],
              ['/leaderboard', 'Leaderboard'],
            ].map(([href, label], index, arr) => (
              <div key={href} className="flex items-center">
                <Link
                  href={href}
                  className={`px-3 py-2 rounded-lg font-semibold text-sm transition ${
                    pathname === href
                      ? 'text-teal-600 bg-teal-50'
                      : 'text-gray-600 hover:text-teal-600 hover:bg-teal-50'
                  }`}
                >
                  {label}
                </Link>

                {/* Divider (not after last item) */}
                {index < arr.length - 1 && (
                  <div className="mx-2 h-5 w-px bg-gray-300" />
                )}
              </div>
            ))}

            {/* Separator + Profile / Auth */}
            <div className="ml-3 pl-3 border-l border-gray-200 h-8 flex items-center">
              {status === 'loading' ? (
                <div className="w-10 h-10 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-gray-300 border-t-teal-600 rounded-full animate-spin" />
                </div>
              ) : session?.user ? (
                <div className="relative" ref={dropdownRef}>
                  {/* Avatar button */}
                  <button
                    type="button"
                    onClick={() => setOpen((v) => !v)}
                    className={`w-10 h-10 rounded-full border-2 overflow-hidden transition ${
                      pathname === '/account'
                        ? 'border-teal-600 bg-teal-50 ring-2 ring-teal-200'
                        : 'border-gray-300 hover:border-teal-500'
                    }`}
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
                        className="block px-4 py-2 text-sm hover:bg-teal-50"
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
                  className="px-3 py-2 rounded-lg font-semibold text-sm text-gray-600 hover:text-teal-600 hover:bg-teal-50"
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