'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import styles from './NavBar.module.css'

export function NavBar() {
  const pathname = usePathname()
  const { data: session } = useSession()

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
          {session?.user ? (
            <div className={styles.userMenu}>
              <span className={styles.userName}>{session.user.name || session.user.email}</span>
              <button onClick={() => signOut()} className={styles.signOutButton}>
                Sign Out
              </button>
            </div>
          ) : (
            <Link 
              href="/auth/signin" 
              className={styles.menuItem}
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
