import type { SubmissionStatus } from '@/lib/store'
import styles from './StatusBadge.module.css'

const STATUS_CONFIG: Record<SubmissionStatus, { label: string; className: string }> = {
  in_review: { label: 'In Review', className: styles.inReview },
  accepted: { label: 'Accepted', className: styles.accepted },
  rejected: { label: 'Rejected', className: styles.rejected },
}

export function StatusBadge({ status }: { status: SubmissionStatus }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.in_review
  return (
    <span className={`${styles.badge} ${config.className}`}>
      {config.label}
    </span>
  )
}
