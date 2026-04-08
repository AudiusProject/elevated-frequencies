import { sdk, type AudiusSdk } from '@audius/sdk'

let audiusSdk: AudiusSdk | null = null

/**
 * OAuth redirect URI registered on your Audius developer app.
 * Default: `${origin}/` so you only register one URL (popup briefly loads `/` with ?code=).
 * Override with VITE_AUDIUS_REDIRECT_URI for fixed production URLs.
 */
function getRedirectUri(): string {
  const override = import.meta.env.VITE_AUDIUS_REDIRECT_URI?.trim()
  if (override) {
    return override
  }
  if (typeof window === 'undefined') {
    return ''
  }
  return `${window.location.origin}/`
}

export function getAudiusSdk(): AudiusSdk {
  if (!audiusSdk) {
    const apiKey = import.meta.env.VITE_AUDIUS_API_KEY?.trim()
    if (!apiKey) {
      throw new Error('VITE_AUDIUS_API_KEY must be set')
    }
    const bearerToken = import.meta.env.VITE_AUDIUS_BEARER_TOKEN?.trim()
    // Always use production Audius (api.audius.co) unless explicitly targeting a local protocol stack.
    // import.meta.env.DEV is true under Vite dev server — do not map that to SDK "development",
    // which points at docker hostnames like http://audius-api.
    const environment =
      import.meta.env.VITE_AUDIUS_ENV === 'development'
        ? 'development'
        : 'production'
    const redirectUri = getRedirectUri()
    if (!redirectUri) {
      throw new Error(
        'Audius OAuth needs a redirect URI: open the app in a browser or set VITE_AUDIUS_REDIRECT_URI'
      )
    }

    audiusSdk = bearerToken
      ? sdk({
          apiKey,
          bearerToken,
          redirectUri,
          environment,
        })
      : sdk({
          apiKey,
          redirectUri,
          environment,
        })
  }
  return audiusSdk
}

export type { AudiusSdk }
