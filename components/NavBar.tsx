'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './NavBar.module.css'

export function NavBar() {
  const pathname = usePathname()

  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>
          💪 Exercise Counter
        </Link>
        <div className={styles.menu}>
          <Link 
            href="/counter" 
            className={`${styles.menuItem} ${pathname === '/counter' ? styles.active : ''}`}
          >
            Counter
          </Link>
          <Link 
            href="/stats" 
            className={`${styles.menuItem} ${pathname === '/stats' ? styles.active : ''}`}
          >
            Stats
          </Link>
        </div>
      </div>
    </nav>
  )
}
