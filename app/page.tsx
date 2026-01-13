import Link from 'next/link'
import styles from './page.module.css'

export default function Home() {
  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <h1 className={styles.title}>Pushup Counter</h1>
        <p className={styles.description}>
          Track your pushups in real-time using AI-powered pose detection
        </p>
        <div className={styles.features}>
          <div className={styles.feature}>
            <h3>🎯 Real-time Detection</h3>
            <p>Uses MediaPipe to accurately count your pushups</p>
          </div>
          <div className={styles.feature}>
            <h3>📊 Session Tracking</h3>
            <p>Track your progress and set goals</p>
          </div>
          <div className={styles.feature}>
            <h3>💪 Stay Motivated</h3>
            <p>Monitor your fitness journey with detailed analytics</p>
          </div>
        </div>
        <Link href="/counter" className={styles.button}>
          Start Counting Pushups
        </Link>
        <p className={styles.note}>
          Make sure to allow camera access when prompted
        </p>
      </div>
    </main>
  )
}
