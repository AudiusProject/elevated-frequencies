/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AUDIUS_API_KEY: string
  readonly VITE_AUDIUS_API_SECRET: string
  readonly VITE_ARTIST_USER_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
