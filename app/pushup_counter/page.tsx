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
    <div className="min-h-[calc(100vh-4rem)] max-h-screen py-4 px-4 sm:px-6 lg:px-8 flex flex-col items-center overflow-y-auto relative">
      <Link 
        href="/counter" 
        className="absolute top-20 sm:top-24 left-4 sm:left-6 px-4 py-2 bg-white rounded-full text-gray-700 font-semibold shadow-md hover:shadow-lg hover:-translate-x-1 transition-all z-40 sm:static sm:top-auto sm:left-auto sm:mb-4 sm:self-start"
      >
        ← Back to Counter
      </Link>
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-4 sm:mb-6 text-center">
        Pushup Counter
      </h1>
      <PoseCounter />
    </div>
  )
}
