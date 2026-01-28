'use client'

import Link from 'next/link'
import Image from 'next/image'
import { getExerciseIconPath } from '@/lib/exercise-icons'

export default function CounterPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] py-6 sm:py-8 lg:py-12 px-4 sm:px-6 lg:px-8 flex justify-center items-center overflow-x-hidden">
      <div className="max-w-5xl w-full text-center">
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent mb-3">
          Choose Your Exercise
        </h1>
        <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 mb-6 sm:mb-8 lg:mb-12">
          Select an exercise to start tracking your reps
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mt-6 sm:mt-8">
          <Link 
            href="/pushup_counter" 
            className="bg-white rounded-2xl p-5 sm:p-6 lg:p-8 shadow-lg hover:shadow-xl hover:-translate-y-2 transition-all duration-300 relative overflow-hidden group flex flex-col items-center min-h-[200px] sm:min-h-[240px]"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-600 to-emerald-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
            <div className="mb-4 flex items-center justify-center">
              {getExerciseIconPath('pushups') ? (
                <Image 
                  src={getExerciseIconPath('pushups')!} 
                  alt="Pushups icon" 
                  width={64} 
                  height={64}
                  className="w-12 h-12 sm:w-16 sm:h-16"
                />
              ) : (
                <span className="text-5xl sm:text-6xl">💪</span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Pushups</h2>
            <p className="text-gray-600 text-sm sm:text-base mb-6 leading-relaxed flex-grow">
              Track your pushups with real-time pose detection
            </p>
            <div className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-full text-sm font-semibold mt-auto">
              Available
            </div>
          </Link>
          
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg opacity-60 cursor-not-allowed flex flex-col items-center">
            <div className="mb-4 flex items-center justify-center">
              {getExerciseIconPath('pullups') ? (
                <Image
                  src={getExerciseIconPath('pullups')!}
                  alt="Pullups icon"
                  width={64}
                  height={64}
                  className="w-12 h-12 sm:w-16 sm:h-16"
                />
              ) : (
                <span className="text-5xl sm:text-6xl">🏋️</span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Pullups</h2>
            <p className="text-gray-600 text-sm sm:text-base mb-6 leading-relaxed flex-grow">
              Coming soon - track your pullups
            </p>
            <div className="px-4 py-2 bg-gray-300 text-gray-600 rounded-full text-sm font-semibold mt-auto">
              Coming Soon
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg opacity-60 cursor-not-allowed flex flex-col items-center">
            <div className="mb-4 flex items-center justify-center">
              {getExerciseIconPath('situps') ? (
                <Image 
                  src={getExerciseIconPath('situps')!} 
                  alt="Situps icon" 
                  width={64} 
                  height={64}
                  className="w-12 h-12 sm:w-16 sm:h-16"
                />
              ) : (
                <span className="text-5xl sm:text-6xl">🧘</span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Situps</h2>
            <p className="text-gray-600 text-sm sm:text-base mb-6 leading-relaxed flex-grow">
              Coming soon - track your situps
            </p>
            <div className="px-4 py-2 bg-gray-300 text-gray-600 rounded-full text-sm font-semibold mt-auto">
              Coming Soon
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}