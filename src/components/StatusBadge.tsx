import type { SubmissionStatus } from '@/lib/store'
import styles from './StatusBadge.module.css'

const STATUS_CONFIG: Record<SubmissionStatus, { label: string; className: string }> = {
  queued: { label: 'In Queue', className: styles.queued },
  in_review: { label: 'In Review', className: styles.inReview },
  listened: { label: 'Listened', className: styles.listened },
  chosen: { label: 'Chosen', className: styles.chosen },
  passed: { label: 'Passed', className: styles.passed },
}

export function StatusBadge({ status }: { status: SubmissionStatus }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.queued
  return (
    <span className={`${styles.badge} ${config.className}`}>
      {config.label}
    </span>
  )
}
