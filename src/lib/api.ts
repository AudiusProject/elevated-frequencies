import { useAuthStore, type Submission, type SubmissionStatus } from './store'

const BASE = '/api'

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = useAuthStore.getState().accessToken
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }
  const res = await fetch(`${BASE}${path}`, { ...options, headers })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error ?? 'Request failed')
  }
  return res.json()
}

export interface CreateSubmissionPayload {
  trackId: string
  trackTitle: string
  artistName: string
  genre: string
  bpm: string
  moods: string[]
  description: string
  releaseStatus: string
  location: string
  instagram: string
  tiktok: string
  spotifyUrl: string
}

export const api = {
  createSubmission: (data: CreateSubmissionPayload) =>
    request<{ submission: Submission }>('/submissions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getMySubmissions: () =>
    request<{ submissions: Submission[] }>('/submissions/mine'),

  getAllSubmissions: (params?: { status?: string; search?: string }) => {
    const qs = new URLSearchParams()
    if (params?.status) qs.set('status', params.status)
    if (params?.search) qs.set('search', params.search)
    const query = qs.toString()
    return request<{ submissions: Submission[] }>(`/submissions${query ? `?${query}` : ''}`)
  },

  getSubmission: (id: number) =>
    request<{ submission: Submission }>(`/submissions/${id}`),

  updateSubmissionStatus: (id: number, status: SubmissionStatus, note?: string) =>
    request<{ submission: Submission }>(`/submissions/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, note }),
    }),

  verifyAuth: (audiusUserId: string, accessToken: string) =>
    request<{ valid: boolean; isArtist: boolean }>('/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ audiusUserId, accessToken }),
    }),

}
