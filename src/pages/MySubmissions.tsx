import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore, type Submission } from '@/lib/store'
import { useAudiusOAuth } from '@/hooks/useAudiusOAuth'
import { api } from '@/lib/api'
import { StatusBadge } from '@/components/StatusBadge'
import { PlayButton } from '@/components/PlayButton'
import styles from './MySubmissions.module.css'

export function MySubmissions() {
  const user = useAuthStore((s) => s.user)
  const { login, loading: authLoading } = useAudiusOAuth()
  const navigate = useNavigate()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    setLoading(true)
    api.getMySubmissions()
      .then((res) => setSubmissions(res.submissions))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [user])

  if (!user) {
    return (
      <section className={styles.authPrompt}>
        <h2>Sign In</h2>
        <p>Connect your Audius account to see your submissions.</p>
        <button onClick={login} className="btn-primary" disabled={authLoading} style={{ maxWidth: 320 }}>
          Sign In with Audius &nbsp;&rarr;
        </button>
      </section>
    )
  }

  return (
    <section className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h2>My Submissions</h2>
          <p>Track the status of your submitted tracks.</p>
        </div>
        <Link to="/submit" className="btn-secondary">Submit New Track &rarr;</Link>
      </div>

      {loading ? (
        <div className={styles.loading}>
          <span className="spin" /> Loading submissions...
        </div>
      ) : error ? (
        <div className={styles.error}>{error}</div>
      ) : submissions.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>&#9835;</div>
          <h3>No Submissions Yet</h3>
          <p>Your submitted tracks will appear here with their review status.</p>
          <Link to="/submit" className="btn-primary" style={{ maxWidth: 280 }}>
            Submit Your First Track &rarr;
          </Link>
        </div>
      ) : (
        <div className={styles.grid}>
          {submissions.map((sub) => (
            <Link to={`/submission/${sub.id}`} key={sub.id} className={styles.card}>
              <div className={styles.cardTop}>
                <PlayButton
                  track={{
                    trackId: sub.trackId,
                    title: sub.trackTitle,
                    artist: sub.artistName,
                    submissionId: sub.id,
                  }}
                />
                <StatusBadge status={sub.status} />
              </div>
              <div className={styles.trackTitle}>{sub.trackTitle}</div>
              <div className={styles.trackArtist}>{sub.artistName}</div>
              <div className={styles.trackMeta}>
                {sub.genre ? <span>{sub.genre}</span> : null}
                {sub.bpm ? <span>{sub.bpm} BPM</span> : null}
              </div>
              <div className={styles.trackDate}>
                Submitted {new Date(sub.createdAt).toLocaleDateString()}
              </div>
              <div className={styles.cardArrow}>&rarr;</div>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
