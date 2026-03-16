import { Link, useNavigate } from 'react-router-dom'
import { Logo } from './Logo'
import { useAuthStore } from '@/lib/store'
import styles from './Header.module.css'

export function Header() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <header className={styles.header}>
      <Link
        to={user?.isArtist ? '/dashboard' : '/'}
        className={styles.logoLockup}
      >
        <Logo size={50} />
        <div className={styles.logoType}>
          <span className={styles.l1}>Elevated</span>
          <span className={styles.l2}>Frequencies</span>
        </div>
      </Link>

      <div className={styles.headerRight}>
        {user ? (
          <>
            <nav className={styles.nav}>
              {user.isArtist ? (
                <Link to="/dashboard" className={styles.navLink}>Dashboard</Link>
              ) : (
                <>
                  <Link to="/my-submissions" className={styles.navLink}>My Submissions</Link>
                  <Link to="/submit" className={styles.navLink}>Submit</Link>
                </>
              )}
            </nav>
            <div className={styles.userInfo}>
              <span className={styles.handle}>@{user.handle}</span>
              <button onClick={handleLogout} className={styles.logoutBtn}>Log out</button>
            </div>
          </>
        ) : (
          <div className={styles.pill}>
            <div className={styles.liveDot} />
            Open for Submissions
          </div>
        )}
      </div>
    </header>
  )
}
