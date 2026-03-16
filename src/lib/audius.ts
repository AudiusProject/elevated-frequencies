import { sdk, StorageNodeSelector } from '@audius/sdk'

let audiusSdk: ReturnType<typeof createSdk> | null = null

function createSdk(apiKey: string, bearerToken: string, storageNodeSelector: InstanceType<typeof StorageNodeSelector>) {
  return sdk({
    apiKey,
    bearerToken,
    appName: 'elevated-frequencies-portal',
    services: {
      storageNodeSelector,
    },
  } as any)
}

export function getAudiusSdk() {
  if (!audiusSdk) {
    const apiKey = import.meta.env.VITE_AUDIUS_API_KEY
    const bearerToken = import.meta.env.VITE_AUDIUS_BEARER_TOKEN
    if (!apiKey || !bearerToken) {
      throw new Error('VITE_AUDIUS_API_KEY and VITE_AUDIUS_BEARER_TOKEN must be set')
    }

    const storageNodeSelector = new StorageNodeSelector({
      endpoint: 'https://api.audius.co',
      bootstrapNodes: [
        {
          endpoint: 'https://creatornode.audius.co',
          delegateOwnerWallet: '0xc8d0C29B6d540295e8fc8ac72456F2f4D41088c8',
        },
        {
          endpoint: 'https://creatornode2.audius.co',
          delegateOwnerWallet: '0xf686647E3737d595C60c6DE2f5F90463542FE439',
        },
      ],
    })

    audiusSdk = createSdk(apiKey, bearerToken, storageNodeSelector)
  }
  return audiusSdk
}

export type AudiusSdk = ReturnType<typeof createSdk>
