import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Pushup Counter',
  description: 'Real-time pushup counter using MediaPipe and computer vision',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
