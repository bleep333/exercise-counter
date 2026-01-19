'use client'

import Link from 'next/link'

export default function CounterPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 sm:py-12 px-4 sm:px-6 lg:px-8 flex justify-center items-center">
      <div className="max-w-5xl w-full text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent mb-3">
          Choose Your Exercise
        </h1>
        <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-8 sm:mb-12">
          Select an exercise to start tracking your reps
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mt-8">
          <Link 
            href="/pushup_counter" 
            className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl hover:-translate-y-2 transition-all duration-300 relative overflow-hidden group flex flex-col items-center"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-600 to-emerald-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
            <div className="text-5xl sm:text-6xl mb-4">💪</div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Pushups</h2>
            <p className="text-gray-600 text-sm sm:text-base mb-6 leading-relaxed flex-grow">
              Track your pushups with real-time pose detection
            </p>
            <div className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-full text-sm font-semibold mt-auto">
              Available
            </div>
          </Link>
          
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg opacity-60 cursor-not-allowed flex flex-col items-center">
            <div className="text-5xl sm:text-6xl mb-4">🏋️</div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Pullups</h2>
            <p className="text-gray-600 text-sm sm:text-base mb-6 leading-relaxed flex-grow">
              Coming soon - track your pullups
            </p>
            <div className="px-4 py-2 bg-gray-300 text-gray-600 rounded-full text-sm font-semibold mt-auto">
              Coming Soon
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg opacity-60 cursor-not-allowed flex flex-col items-center">
            <div className="text-5xl sm:text-6xl mb-4">🧘</div>
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
