import { useCallback, useRef } from 'react'
import { useAudioStore } from '@/lib/audioStore'
import styles from './NowPlayingBar.module.css'

function formatTime(seconds: number): string {
  if (!seconds || !Number.isFinite(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function NowPlayingBar() {
  const progressRef = useRef<HTMLDivElement>(null)
  const { currentTrack, isPlaying, isLoading, duration, currentTime, togglePlayPause, seek, stop } = useAudioStore()

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!duration || !progressRef.current) return
      const rect = progressRef.current.getBoundingClientRect()
      const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
      seek(pct * duration)
    },
    [duration, seek]
  )

  if (!currentTrack) return null

  return (
    <div className={styles.bar}>
      <div className={styles.progressWrap} ref={progressRef} onClick={handleProgressClick}>
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className={styles.content}>
        <button
          className={styles.playBtn}
          onClick={togglePlayPause}
          disabled={isLoading}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isLoading ? (
            <span className="spin" />
          ) : isPlaying ? (
            <svg width="16" height="16" viewBox="0 0 18 18" fill="currentColor">
              <rect x="4" y="3" width="3.5" height="12" rx="1" />
              <rect x="10.5" y="3" width="3.5" height="12" rx="1" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 18 18" fill="currentColor">
              <path d="M5 3.5L14.5 9L5 14.5V3.5Z" />
            </svg>
          )}
        </button>

        <div className={styles.trackInfo}>
          <span className={styles.trackTitle}>{currentTrack.title}</span>
          <span className={styles.trackArtist}>{currentTrack.artist}</span>
        </div>

        <div className={styles.timeDisplay}>
          {formatTime(currentTime)}
          <span className={styles.sep}>/</span>
          {formatTime(duration)}
        </div>

        <button className={styles.closeBtn} onClick={stop} aria-label="Stop">
          <svg width="12" height="12" viewBox="0 0 12 12" stroke="currentColor" strokeWidth="1.5" fill="none">
            <path d="M2 2l8 8M10 2l-8 8" />
          </svg>
        </button>
      </div>
    </div>
  )
}
