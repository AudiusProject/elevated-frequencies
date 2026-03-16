import { useCallback, useRef } from 'react'
import { useAudioStore, type PlayingTrack } from '@/lib/audioStore'
import styles from './AudioPlayer.module.css'

function formatTime(seconds: number): string {
  if (!seconds || !Number.isFinite(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

interface AudioPlayerProps {
  track: PlayingTrack
}

export function AudioPlayer({ track }: AudioPlayerProps) {
  const progressRef = useRef<HTMLDivElement>(null)
  const { currentTrack, isPlaying, isLoading, duration, currentTime, volume, error, play, togglePlayPause, seek, setVolume } =
    useAudioStore()

  const isThisTrack = currentTrack?.trackId === track.trackId
  const active = isThisTrack && isPlaying
  const progress = isThisTrack && duration > 0 ? (currentTime / duration) * 100 : 0

  const handlePlay = useCallback(() => {
    if (isThisTrack) {
      togglePlayPause()
    } else {
      play(track)
    }
  }, [isThisTrack, togglePlayPause, play, track])

  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isThisTrack || !duration || !progressRef.current) return
      const rect = progressRef.current.getBoundingClientRect()
      const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
      seek(pct * duration)
    },
    [isThisTrack, duration, seek]
  )

  return (
    <div className={styles.player}>
      <div className={styles.row}>
        <button
          className={`${styles.playBtn} ${active ? styles.playing : ''}`}
          onClick={handlePlay}
          disabled={isLoading && isThisTrack}
          aria-label={active ? 'Pause' : 'Play'}
        >
          {isLoading && isThisTrack ? (
            <span className="spin" />
          ) : active ? (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
              <rect x="4" y="3" width="3.5" height="12" rx="1" />
              <rect x="10.5" y="3" width="3.5" height="12" rx="1" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
              <path d="M5 3.5L14.5 9L5 14.5V3.5Z" />
            </svg>
          )}
        </button>

        <div className={styles.timeInfo}>
          <span className={styles.time}>{isThisTrack ? formatTime(currentTime) : '0:00'}</span>
          <span className={styles.sep}>/</span>
          <span className={styles.time}>{isThisTrack ? formatTime(duration) : '--:--'}</span>
        </div>

        <div className={styles.volumeControl}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3">
            <path d="M2 5.5h2l3-2.5v8l-3-2.5H2a.5.5 0 01-.5-.5V6a.5.5 0 01.5-.5z" fill="currentColor" />
            {volume > 0.01 ? <path d="M9.5 4.5c.7.8 1 1.7 1 2.5s-.3 1.7-1 2.5" /> : null}
            {volume > 0.5 ? <path d="M11 3c1.1 1.2 1.5 2.5 1.5 4s-.4 2.8-1.5 4" /> : null}
          </svg>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className={styles.volumeSlider}
          />
        </div>
      </div>

      <div className={styles.progressWrap} ref={progressRef} onClick={handleProgressClick}>
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${progress}%` }} />
          {isThisTrack && duration > 0 ? (
            <div className={styles.progressThumb} style={{ left: `${progress}%` }} />
          ) : null}
        </div>
      </div>

      {error && isThisTrack ? <div className={styles.error}>{error}</div> : null}
    </div>
  )
}
