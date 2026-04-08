import { useState, useCallback } from 'react'

import { getAudiusSdk } from '@/lib/audius'
import { mapSdkUserToAudiusUser } from '@/lib/mapAudiusUser'
import { useAuthStore } from '@/lib/store'

export function useAudiusOAuth() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const setAuth = useAuthStore((s) => s.setAuth)

  const login = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const audiusSdk = getAudiusSdk()
      await audiusSdk.oauth.login({
        scope: 'write',
        display: 'popup',
      })
      const profile = await audiusSdk.oauth.getUser()
      const accessToken = await audiusSdk.tokenStore.getAccessToken()
      setAuth(
        mapSdkUserToAudiusUser(profile),
        `${profile.id}:${accessToken ?? ''}`
      )
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : 'Authentication failed'
      setError(message)
      console.error('OAuth error:', e)
    } finally {
      setLoading(false)
    }
  }, [setAuth])

  return { login, loading, error }
}
