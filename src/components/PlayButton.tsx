import { useCallback } from 'react'
import { useAudioStore, type PlayingTrack } from '@/lib/audioStore'
import styles from './PlayButton.module.css'

interface PlayButtonProps {
  track: PlayingTrack
  size?: 'sm' | 'md'
}

export function PlayButton({ track, size = 'md' }: PlayButtonProps) {
  const { currentTrack, isPlaying, isLoading, play, togglePlayPause } = useAudioStore()

  const isThisTrack = currentTrack?.trackId === track.trackId
  const active = isThisTrack && isPlaying
  const loading = isThisTrack && isLoading

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (isThisTrack) {
        togglePlayPause()
      } else {
        play(track)
      }
    },
    [isThisTrack, togglePlayPause, play, track]
  )

  return (
    <button
      className={`${styles.btn} ${styles[size]} ${active ? styles.active : ''}`}
      onClick={handleClick}
      disabled={loading}
      aria-label={active ? 'Pause' : 'Play'}
    >
      {loading ? (
        <span className="spin" />
      ) : active ? (
        <svg viewBox="0 0 18 18" fill="currentColor" className={styles.icon}>
          <rect x="4" y="3" width="3.5" height="12" rx="1" />
          <rect x="10.5" y="3" width="3.5" height="12" rx="1" />
        </svg>
      ) : (
        <svg viewBox="0 0 18 18" fill="currentColor" className={styles.icon}>
          <path d="M5 3.5L14.5 9L5 14.5V3.5Z" />
        </svg>
      )}
    </button>
  )
}
