import { useState, useCallback } from 'react'
import { useAuthStore } from '@/lib/store'
import { getAudiusSdk } from '@/lib/audius'

const ARTIST_USER_ID = import.meta.env.VITE_ARTIST_USER_ID ?? ''

export function useAudiusOAuth() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const setAuth = useAuthStore((s) => s.setAuth)

  const login = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const audiusSdk = getAudiusSdk()
      if (!audiusSdk.oauth) {
        setError('OAuth not available (requires browser)')
        setLoading(false)
        return
      }
      audiusSdk.oauth.init({
        successCallback: (profile: any, encodedJwt: string) => {
          const userId = profile.userId ?? ''
          const isArtist = ARTIST_USER_ID !== '' && String(userId) === String(ARTIST_USER_ID)

          setAuth(
            {
              id: String(userId),
              handle: profile.handle ?? '',
              name: profile.name ?? profile.handle ?? '',
              profilePicture: profile.profilePicture?._150x150 ?? profile.profilePicture?._480x480 ?? undefined,
              isArtist,
            },
            `${userId}:${encodedJwt}`
          )
          setLoading(false)
        },
        errorCallback: (errorMessage: string) => {
          console.error('OAuth error:', errorMessage)
          setError(errorMessage ?? 'Authentication failed')
          setLoading(false)
        },
      })
      audiusSdk.oauth.login({ scope: 'write' })
    } catch (e: any) {
      setError(e.message)
      setLoading(false)
    }
  }, [setAuth])

  return { login, loading, error }
}
