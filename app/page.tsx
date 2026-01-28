import Link from 'next/link'
import Image from 'next/image'

export default function Home() {
  return (
    <main 
      className="flex items-center justify-center min-h-[calc(100vh-4rem)] py-8 px-4 sm:py-12 sm:px-6 lg:px-8 overflow-x-hidden"
      style={{
        backgroundImage: 'url(/landing-background.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="w-full max-w-xl text-center space-y-4 sm:space-y-5">

        <div className="flex justify-center">
            <Image
              src="/landing-track-icon.svg"
              alt="Tracking visualization"
              width={75}
              height={12}
              className="opacity-60 w-full max-w-[75px] h-auto"
            />
        </div>

        <div className="mt-4 sm:mt-5">
          <Link
            href="/counter"
            className="inline-flex items-center justify-center px-6 sm:px-7 py-3 sm:py-4 rounded-full bg-gradient-to-r from-teal-600 to-emerald-600 text-white text-base sm:text-lg font-semibold shadow-md hover:shadow-lg hover:opacity-95 transition min-h-[44px]"
          >
            Start Counting
          </Link>
        </div>

        <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-gray-500 px-2">
          AI-powered bodyweight rep counter using your camera
        </p>
        
      </div>
    </main>
  )
}