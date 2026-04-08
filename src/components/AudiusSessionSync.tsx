import { useEffect } from 'react'

import { getAudiusSdk } from '@/lib/audius'
import { mapSdkUserToAudiusUser } from '@/lib/mapAudiusUser'
import { useAuthStore } from '@/lib/store'

/**
 * Completes OAuth popup/full-page redirects and restores sessions from the SDK token store.
 * Mount once inside the browser router (needs window.location for redirect detection).
 */
export function AudiusSessionSync({ children }: { children: React.ReactNode }) {
  const setAuth = useAuthStore((s) => s.setAuth)
  const logout = useAuthStore((s) => s.logout)

  useEffect(() => {
    let cancelled = false

    const runSync = () => {
      void (async () => {
        try {
          const audiusSdk = getAudiusSdk()

          if (audiusSdk.oauth.hasRedirectResult()) {
            await audiusSdk.oauth.handleRedirect()
            const user = await audiusSdk.oauth.getUser()
            const accessToken = await audiusSdk.tokenStore.getAccessToken()
            if (!cancelled) {
              setAuth(
                mapSdkUserToAudiusUser(user),
                `${user.id}:${accessToken ?? ''}`
              )
            }
          } else {
            const authed = await audiusSdk.oauth.isAuthenticated()
            if (authed) {
              try {
                const user = await audiusSdk.oauth.getUser()
                const accessToken = await audiusSdk.tokenStore.getAccessToken()
                if (!cancelled) {
                  setAuth(
                    mapSdkUserToAudiusUser(user),
                    `${user.id}:${accessToken ?? ''}`
                  )
                }
              } catch {
                await audiusSdk.oauth.logout().catch(() => {})
                if (!cancelled) {
                  logout()
                }
              }
            } else if (useAuthStore.getState().user) {
              if (!cancelled) {
                logout()
              }
            }
          }
        } catch (e) {
          console.error('Audius session sync error:', e)
        }
      })()
    }

    if (useAuthStore.persist.hasHydrated()) {
      runSync()
    } else {
      const unsub = useAuthStore.persist.onFinishHydration(runSync)
      return () => {
        cancelled = true
        unsub()
      }
    }

    return () => {
      cancelled = true
    }
  }, [setAuth, logout])

  return <>{children}</>
}
