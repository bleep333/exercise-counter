'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { PoseCounter } from '@/components/PoseCounter'
import styles from './page.module.css'

export default function CounterPage() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading...</div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <Link href="/counter" className={styles.backButton}>
        ← Back to Counter
      </Link>
      <h1 className={styles.title}>Pushup Counter</h1>
      <PoseCounter />
    </div>
  )
}
