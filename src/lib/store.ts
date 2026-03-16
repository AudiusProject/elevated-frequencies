import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type SubmissionStatus = 'in_review' | 'accepted' | 'rejected'

export interface AudiusUser {
  id: string
  handle: string
  name: string
  profilePicture?: string
  isArtist: boolean
}

export interface Submission {
  id: number
  trackId: string
  trackTitle: string
  audiusUserId: string
  audiusHandle: string
  artistName: string
  genre: string
  bpm: string
  description: string
  releaseStatus: string
  location: string
  instagram: string
  tiktok: string
  spotifyUrl: string
  status: SubmissionStatus
  createdAt: string
  updatedAt: string
}

interface AuthState {
  user: AudiusUser | null
  accessToken: string | null
  setAuth: (user: AudiusUser, token: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      setAuth: (user, accessToken) => set({ user, accessToken }),
      logout: () => set({ user: null, accessToken: null }),
    }),
    { name: 'ef-auth' }
  )
)
