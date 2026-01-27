import Link from 'next/link'
import Image from 'next/image'

export default function Home() {
  return (
    <main 
      className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4 sm:px-6 lg:px-8"
      style={{
        backgroundImage: 'url(/landing-background.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="w-full max-w-xl text-center">

        <div className="flex justify-center">
            <Image
              src="/landing-track-icon.svg"
              alt="Tracking visualization"
              width={75}
              height={12}
              className="opacity-60"
            />
        </div>

        <div className="mt-5">
          <Link
            href="/counter"
            className="inline-flex items-center justify-center px-7 py-4 rounded-full bg-gradient-to-r from-teal-600 to-emerald-600 text-white text-lg font-semibold shadow-md hover:shadow-lg hover:opacity-95 transition"
          >
            Start Counting
          </Link>
        </div>

        <p className="mt-4 text-sm text-gray-500">
          AI-powered bodyweight rep counter using your camera
        </p>
        
      </div>
    </main>
  )
}