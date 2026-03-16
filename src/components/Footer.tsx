import { Logo } from './Logo'
import styles from './Footer.module.css'

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerLogo}>
        <Logo size={32} />
        <div className={styles.footerName}>Elevated Frequencies</div>
      </div>
      <div className={styles.footerRight}>
        Music infrastructure by{' '}
        <a href="https://audius.co" target="_blank" rel="noreferrer">Audius</a>
        {' '}&amp; Open Audio Protocol &nbsp;&middot;&nbsp; &copy; 2026
      </div>
    </footer>
  )
}
