import type { Metadata } from 'next'
import './globals.css'
import { NavBar } from '@/components/NavBar'

export const metadata: Metadata = {
  title: 'Exercise Counter',
  description: 'Real-time exercise counter using MediaPipe and computer vision',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <NavBar />
        {children}
      </body>
    </html>
  )
}
