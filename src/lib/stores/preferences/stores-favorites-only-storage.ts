import { createLocalStorage } from '@/lib/shared/storage'
import type { StorageService } from '@/lib/shared/storage'

export type StoresFavoritesOnlyStorage = {
  readonly load: () => boolean
  readonly save: (value: boolean) => void
}

export const STORES_FAVORITES_ONLY_STORAGE_KEY = 'stores-favorites-only'

export const createStoresFavoritesOnlyStorage = (
  storageService: StorageService = createLocalStorage(),
): StoresFavoritesOnlyStorage => ({
  load: () => storageService.get(STORES_FAVORITES_ONLY_STORAGE_KEY) === 'true',
  save: (value) => {
    if (!value) {
      storageService.remove(STORES_FAVORITES_ONLY_STORAGE_KEY)
      return undefined
    }

    storageService.set(STORES_FAVORITES_ONLY_STORAGE_KEY, 'true')
  },
})
