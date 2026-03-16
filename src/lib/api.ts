import { useAuthStore, type Submission, type SubmissionStatus } from './store'
import { isCuratorApp, getCuratorKey } from './curator'

const BASE = '/api'

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  }
  if (isCuratorApp() && getCuratorKey()) {
    headers['X-Curator-Key'] = getCuratorKey()
  } else {
    const token = useAuthStore.getState().accessToken
    if (token) headers['Authorization'] = `Bearer ${token}`
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
  description: string
  releaseStatus: string
  location: string
  instagram: string
  tiktok: string
  spotifyUrl: string
}

export interface Comment {
  id: string
  submissionId: number
  userId: string
  userHandle: string
  userName: string
  body: string
  createdAt: string
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

  getComments: (submissionId: number) =>
    request<{ comments: Comment[] }>(`/submissions/${submissionId}/comments`),

  postComment: (
    submissionId: number,
    body: string,
    opts?: { userHandle?: string; userName?: string; curatorName?: string }
  ) =>
    request<{ comment: Comment }>(`/submissions/${submissionId}/comments`, {
      method: 'POST',
      body: JSON.stringify({
        body,
        userHandle: opts?.userHandle ?? '',
        userName: opts?.userName ?? '',
        curatorName: opts?.curatorName ?? '',
      }),
    }),
}
