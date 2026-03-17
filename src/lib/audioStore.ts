import { create } from 'zustand'
import { getAudiusSdk } from './audius'

const STREAM_LOAD_TIMEOUT_MS = 12_000

export interface PlayingTrack {
  trackId: string
  title: string
  artist: string
  submissionId?: number
}

interface AudioState {
  audio: HTMLAudioElement | null
  currentTrack: PlayingTrack | null
  isPlaying: boolean
  isLoading: boolean
  duration: number
  currentTime: number
  volume: number
  error: string | null

  play: (track: PlayingTrack) => Promise<void>
  togglePlayPause: () => void
  pause: () => void
  seek: (time: number) => void
  setVolume: (vol: number) => void
  stop: () => void
}

let globalAudio: HTMLAudioElement | null = null

function getOrCreateAudio(): HTMLAudioElement {
  if (!globalAudio) {
    globalAudio = new Audio()
    globalAudio.preload = 'metadata'
  }
  return globalAudio
}

/** Try to load a single stream URL; resolve on canplay, reject on error or timeout. */
function loadStreamUrl(audio: HTMLAudioElement, url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      audio.removeEventListener('canplay', onCanPlay)
      audio.removeEventListener('error', onError)
      audio.pause()
      audio.removeAttribute('src')
      reject(new Error('Stream timeout'))
    }, STREAM_LOAD_TIMEOUT_MS)

    const onCanPlay = () => {
      clearTimeout(timeoutId)
      audio.removeEventListener('error', onError)
      resolve()
    }
    const onError = () => {
      clearTimeout(timeoutId)
      audio.removeEventListener('canplay', onCanPlay)
      audio.removeAttribute('src')
      reject(new Error('Stream failed'))
    }

    audio.addEventListener('canplay', onCanPlay, { once: true })
    audio.addEventListener('error', onError, { once: true })
    audio.src = url
    audio.load()
  })
}

/** Build list of stream URLs: primary url first, then mirrors, deduped. */
function getStreamUrls(trackData: { stream?: { url?: string; mirrors?: string[] } }): string[] {
  const urls: string[] = []
  const seen = new Set<string>()
  const add = (u: string) => {
    if (u && !seen.has(u)) {
      seen.add(u)
      urls.push(u)
    }
  }
  if (trackData?.stream?.url) add(trackData.stream.url)
  if (Array.isArray(trackData?.stream?.mirrors)) {
    trackData.stream.mirrors.forEach(add)
  }
  return urls
}

export const useAudioStore = create<AudioState>()((set, get) => ({
  audio: null,
  currentTrack: null,
  isPlaying: false,
  isLoading: false,
  duration: 0,
  currentTime: 0,
  volume: 0.8,
  error: null,

  play: async (track: PlayingTrack) => {
    const state = get()
    const audio = getOrCreateAudio()

    if (state.currentTrack?.trackId === track.trackId && !state.error) {
      if (!state.isPlaying) {
        audio.play()
        set({ isPlaying: true })
      }
      return
    }

    audio.pause()
    audio.removeAttribute('src')
    set({ isLoading: true, error: null, currentTrack: track, isPlaying: false, currentTime: 0, duration: 0 })

    try {
      const sdk = getAudiusSdk()
      const trackRes = await sdk.tracks.getTrack({ trackId: track.trackId })
      const trackData = (trackRes as { data?: { stream?: { url?: string; mirrors?: string[] } } })?.data
      const streamUrls = getStreamUrls(trackData ?? {})
      if (streamUrls.length === 0) {
        throw new Error('No stream URL or mirrors in track response')
      }

      let lastErr: Error | null = null
      for (const url of streamUrls) {
        try {
          await loadStreamUrl(audio, url)
          lastErr = null
          break
        } catch (e) {
          lastErr = e instanceof Error ? e : new Error(String(e))
          continue
        }
      }
      if (lastErr) {
        throw lastErr
      }

      audio.volume = get().volume
      audio.onloadedmetadata = () => {
        set({ duration: audio.duration })
      }
      audio.ontimeupdate = () => {
        set({ currentTime: audio.currentTime })
      }
      audio.onended = () => {
        set({ isPlaying: false, currentTime: 0 })
      }
      audio.onerror = () => {
        set({ error: 'Failed to load audio', isPlaying: false, isLoading: false })
      }

      set({ audio, isLoading: false })
      await audio.play()
      set({ isPlaying: true })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Playback failed'
      console.error('Playback error:', err)
      set({ error: message, isLoading: false, isPlaying: false })
    }
  },

  togglePlayPause: () => {
    const { audio, isPlaying } = get()
    if (!audio) return
    if (isPlaying) {
      audio.pause()
      set({ isPlaying: false })
    } else {
      audio.play()
      set({ isPlaying: true })
    }
  },

  pause: () => {
    const { audio } = get()
    if (!audio) return
    audio.pause()
    set({ isPlaying: false })
  },

  seek: (time: number) => {
    const { audio } = get()
    if (!audio) return
    audio.currentTime = time
    set({ currentTime: time })
  },

  setVolume: (vol: number) => {
    const { audio } = get()
    if (audio) audio.volume = vol
    set({ volume: vol })
  },

  stop: () => {
    const { audio } = get()
    if (audio) {
      audio.pause()
      audio.removeAttribute('src')
    }
    set({ currentTrack: null, isPlaying: false, currentTime: 0, duration: 0, error: null })
  },
}))
