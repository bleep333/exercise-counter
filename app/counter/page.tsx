'use client'

import Link from 'next/link'
import styles from './page.module.css'

export default function CounterPage() {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>Choose Your Exercise</h1>
        <p className={styles.description}>
          Select an exercise to start tracking your reps
        </p>
        
        <div className={styles.exerciseGrid}>
          <Link href="/pushup_counter" className={styles.exerciseCard}>
            <div className={styles.exerciseIcon}>💪</div>
            <h2 className={styles.exerciseName}>Pushups</h2>
            <p className={styles.exerciseDescription}>
              Track your pushups with real-time pose detection
            </p>
            <div className={styles.badge}>Available</div>
          </Link>
          
          <div className={`${styles.exerciseCard} ${styles.disabled}`}>
            <div className={styles.exerciseIcon}>🏋️</div>
            <h2 className={styles.exerciseName}>Pullups</h2>
            <p className={styles.exerciseDescription}>
              Coming soon - track your pullups
            </p>
            <div className={`${styles.badge} ${styles.badgeComingSoon}`}>Coming Soon</div>
          </div>
          
          <div className={`${styles.exerciseCard} ${styles.disabled}`}>
            <div className={styles.exerciseIcon}>🧘</div>
            <h2 className={styles.exerciseName}>Situps</h2>
            <p className={styles.exerciseDescription}>
              Coming soon - track your situps
            </p>
            <div className={`${styles.badge} ${styles.badgeComingSoon}`}>Coming Soon</div>
          </div>
        </div>
      </div>
    </div>
  )
}
