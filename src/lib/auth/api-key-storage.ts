import { createSessionStorage } from '@/lib/shared/storage'
import type { StorageService } from '@/lib/shared/storage'

export type ApiKeyStorage = {
  readonly save: (apiKey: string) => void
  readonly load: () => string | null
  readonly clear: () => void
}

const STORAGE_KEY = 'gemini-api-key'

export const createApiKeyStorage = (
  storageService: StorageService,
  storageKey: string = STORAGE_KEY,
): ApiKeyStorage => ({
  save: (apiKey) => storageService.set(storageKey, apiKey),
  load: () => storageService.get(storageKey),
  clear: () => storageService.remove(storageKey),
})

export const createDefaultApiKeyStorage = (): ApiKeyStorage =>
  createApiKeyStorage(createSessionStorage())
