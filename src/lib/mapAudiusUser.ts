import type { User } from '@audius/sdk'

import type { AudiusUser } from '@/lib/store'

const ARTIST_USER_ID = (import.meta.env.VITE_ARTIST_USER_ID ?? '').trim()

export function mapSdkUserToAudiusUser(profile: User): AudiusUser {
  const userId = String(profile.id)
  const isArtist =
    ARTIST_USER_ID !== '' && String(userId) === String(ARTIST_USER_ID)

  return {
    id: userId,
    handle: profile.handle,
    name: profile.name ?? profile.handle,
    profilePicture:
      profile.profilePicture?._150x150 ??
      profile.profilePicture?._480x480 ??
      undefined,
    isArtist,
  }
}
