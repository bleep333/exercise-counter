'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { PoseCounter } from '@/components/PoseCounter'

export default function CounterPage() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] max-h-screen py-4 px-4 sm:px-6 lg:px-8 flex flex-col items-center overflow-y-auto relative overflow-x-hidden">
      <Link 
        href="/counter" 
        className="absolute top-16 sm:top-20 lg:top-24 left-4 sm:left-6 px-3 sm:px-4 py-2 bg-white rounded-full text-gray-700 font-semibold text-sm sm:text-base shadow-md hover:shadow-lg hover:-translate-x-1 transition-all z-40 min-h-[44px] flex items-center sm:static sm:top-auto sm:left-auto sm:mb-4 sm:self-start"
      >
        ← Back to Counter
      </Link>
      <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-800 mb-3 sm:mb-4 lg:mb-6 text-center px-2">
        Pushup Counter
      </h1>
      <PoseCounter />
    </div>
  )
}
