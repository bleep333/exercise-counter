import type { Metadata, Viewport } from 'next'
import './globals.css'
import { NavBar } from '@/components/NavBar'
import { SessionProvider } from '@/components/SessionProvider'

export const metadata: Metadata = {
  title: 'Exercise Counter',
  description: 'Real-time exercise counter using MediaPipe and computer vision',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="overflow-x-hidden">
      <body className="overflow-x-hidden">
        <SessionProvider>
          <NavBar />
          <div className="overflow-x-hidden">
            {children}
          </div>
        </SessionProvider>
      </body>
    </html>
  )
}
