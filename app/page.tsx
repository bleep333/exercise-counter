import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-xl text-center">
        <h1 className="text-3xl sm:text-4xl font-semibold text-gray-900">
          Exercise Counter
        </h1>

        <div className="mt-8">
          <Link
            href="/counter"
            className="inline-flex items-center justify-center px-7 py-4 rounded-full bg-gradient-to-r from-teal-600 to-emerald-600 text-white text-lg font-semibold shadow-md hover:shadow-lg hover:opacity-95 transition"
          >
            Start Counting
          </Link>
        </div>

        <p className="mt-4 text-sm text-gray-500">
          No account required • Save results later
        </p>
      </div>
    </main>
  )
}