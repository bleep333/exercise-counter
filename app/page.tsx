import Link from 'next/link'
import styles from './page.module.css'

export default function Home() {
  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.hero}>
          <h1 className={styles.title}>Exercise Counter</h1>
          <p className={styles.subtitle}>
            Track your workouts in real-time using AI-powered pose detection
          </p>
          <p className={styles.description}>
            Transform your fitness journey with intelligent exercise tracking. 
            Get accurate rep counts, track your progress, and achieve your fitness goals.
          </p>
          <Link href="/counter" className={styles.ctaButton}>
            Start Counting
          </Link>
        </div>
        
        <div className={styles.features}>
          <div className={styles.feature}>
            <div className={styles.featureIcon}>🎯</div>
            <h3>Real-time Detection</h3>
            <p>Uses MediaPipe to accurately count your exercises with computer vision</p>
          </div>
          <div className={styles.feature}>
            <div className={styles.featureIcon}>📊</div>
            <h3>Progress Tracking</h3>
            <p>View detailed statistics and track your improvement over time</p>
          </div>
          <div className={styles.feature}>
            <div className={styles.featureIcon}>💪</div>
            <h3>Multiple Exercises</h3>
            <p>Support for pushups, pullups, situps, and more exercises coming soon</p>
          </div>
        </div>
      </div>
    </main>
  )
}
