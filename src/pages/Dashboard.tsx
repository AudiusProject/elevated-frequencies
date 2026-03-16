import { useEffect, useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore, type Submission, type SubmissionStatus } from '@/lib/store'
import { api } from '@/lib/api'
import { StatusBadge } from '@/components/StatusBadge'
import { PlayButton } from '@/components/PlayButton'
import styles from './Dashboard.module.css'

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'queued', label: 'Queued' },
  { value: 'in_review', label: 'In Review' },
  { value: 'listened', label: 'Listened' },
  { value: 'chosen', label: 'Chosen' },
  { value: 'passed', label: 'Passed' },
]

export function Dashboard() {
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!user?.isArtist) {
      navigate('/')
      return
    }
  }, [user, navigate])

  useEffect(() => {
    if (!user?.isArtist) return
    setLoading(true)
    api.getAllSubmissions({ status: statusFilter, search: search.trim() || undefined })
      .then((res) => setSubmissions(res.submissions))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [user, statusFilter, search])

  const stats = useMemo(() => {
    const all = submissions.length
    const queued = submissions.filter((s) => s.status === 'queued').length
    const chosen = submissions.filter((s) => s.status === 'chosen').length
    return { all, queued, chosen }
  }, [submissions])

  if (!user?.isArtist) return null

  const handleStatusChange = async (id: number, newStatus: SubmissionStatus) => {
    try {
      const res = await api.updateSubmissionStatus(id, newStatus)
      setSubmissions((prev) => prev.map((s) => (s.id === id ? res.submission : s)))
    } catch (err: any) {
      console.error('Status update failed:', err)
    }
  }

  return (
    <section className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.eyebrow}>Artist Dashboard</div>
          <h2>Submission Queue</h2>
        </div>
        <div className={styles.statsRow}>
          <div className={styles.stat}>
            <div className={styles.statNum}>{stats.all}</div>
            <div className={styles.statLabel}>Total</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statNum}>{stats.queued}</div>
            <div className={styles.statLabel}>Queued</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statNum}>{stats.chosen}</div>
            <div className={styles.statLabel}>Chosen</div>
          </div>
        </div>
      </div>

      <div className={styles.controls}>
        <div className={styles.tabs}>
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              className={`${styles.tab} ${statusFilter === f.value ? styles.tabActive : ''}`}
              onClick={() => setStatusFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Search by track, artist, or handle..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className={styles.loading}>
          <span className="spin" /> Loading submissions...
        </div>
      ) : error ? (
        <div className={styles.error}>{error}</div>
      ) : submissions.length === 0 ? (
        <div className={styles.empty}>
          <h3>No Submissions</h3>
          <p>{statusFilter !== 'all' ? `No submissions with status "${statusFilter}".` : 'No submissions yet.'}</p>
        </div>
      ) : (
        <div className={styles.table}>
          <div className={styles.tableHeader}>
            <div className={styles.colPlay} />
            <div className={styles.colTrack}>Track</div>
            <div className={styles.colArtist}>Artist</div>
            <div className={styles.colGenre}>Genre</div>
            <div className={styles.colDate}>Date</div>
            <div className={styles.colStatus}>Status</div>
            <div className={styles.colActions}>Actions</div>
          </div>
          {submissions.map((sub) => (
            <div className={styles.tableRow} key={sub.id}>
              <div className={styles.colPlay}>
                <PlayButton
                  size="sm"
                  track={{
                    trackId: sub.trackId,
                    title: sub.trackTitle,
                    artist: sub.artistName,
                    submissionId: sub.id,
                  }}
                />
              </div>
              <div className={styles.colTrack}>
                <Link to={`/submission/${sub.id}`} className={styles.trackLink}>
                  {sub.trackTitle}
                </Link>
                {sub.moods ? (
                  <div className={styles.trackMoods}>
                    {sub.moods.split(',').filter(Boolean).map((m) => (
                      <span key={m} className={styles.moodTag}>{m.trim()}</span>
                    ))}
                  </div>
                ) : null}
              </div>
              <div className={styles.colArtist}>
                <div className={styles.artistName}>{sub.artistName}</div>
                {sub.audiusHandle ? <div className={styles.artistHandle}>@{sub.audiusHandle}</div> : null}
              </div>
              <div className={styles.colGenre}>{sub.genre}</div>
              <div className={styles.colDate}>
                {new Date(sub.createdAt).toLocaleDateString()}
              </div>
              <div className={styles.colStatus}>
                <StatusBadge status={sub.status} />
              </div>
              <div className={styles.colActions}>
                <select
                  value={sub.status}
                  onChange={(e) => handleStatusChange(sub.id, e.target.value as SubmissionStatus)}
                  className={styles.statusSelect}
                >
                  <option value="queued">Queued</option>
                  <option value="in_review">In Review</option>
                  <option value="listened">Listened</option>
                  <option value="chosen">Chosen</option>
                  <option value="passed">Passed</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
