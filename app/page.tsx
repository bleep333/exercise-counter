import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex justify-center items-center min-h-[calc(100vh-4rem)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl w-full text-center">
        <div className="mb-12 sm:mb-16">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4 leading-tight">
            Exercise Counter
          </h1>
          <p className="text-xl sm:text-2xl md:text-3xl text-gray-700 mb-3 font-semibold">
            Track your workouts in real-time using AI-powered pose detection
          </p>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            Transform your fitness journey with intelligent exercise tracking. 
            Get accurate rep counts, track your progress, and achieve your fitness goals.
          </p>
          <Link 
            href="/counter" 
            className="inline-block px-6 py-4 sm:px-8 sm:py-5 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-lg sm:text-xl font-bold rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 hover:scale-105 transition-all duration-300 uppercase tracking-wide"
          >
            Start Counting
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mt-12">
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl hover:-translate-y-2 transition-all duration-300 text-center">
            <div className="text-5xl sm:text-6xl mb-4">🎯</div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3">Real-time Detection</h3>
            <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
              Uses MediaPipe to accurately count your exercises with computer vision
            </p>
          </div>
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl hover:-translate-y-2 transition-all duration-300 text-center">
            <div className="text-5xl sm:text-6xl mb-4">📊</div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3">Progress Tracking</h3>
            <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
              View detailed statistics and track your improvement over time
            </p>
          </div>
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl hover:-translate-y-2 transition-all duration-300 text-center">
            <div className="text-5xl sm:text-6xl mb-4">💪</div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3">Multiple Exercises</h3>
            <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
              Support for pushups, pullups, situps, and more exercises coming soon
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
