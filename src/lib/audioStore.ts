import { create } from 'zustand'
import { getAudiusSdk } from './audius'

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
      const streamUrl =
        trackData?.stream?.url ??
        (Array.isArray(trackData?.stream?.mirrors) && trackData.stream.mirrors.length > 0
          ? trackData.stream.mirrors[0]
          : null)
      if (!streamUrl) {
        throw new Error('No stream URL in track response')
      }
      audio.src = streamUrl
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
      audio.oncanplay = () => {
        set({ isLoading: false })
      }

      await audio.play()
      set({ audio, isPlaying: true, isLoading: false })
    } catch (err: any) {
      console.error('Playback error:', err)
      set({ error: err.message ?? 'Playback failed', isLoading: false, isPlaying: false })
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
