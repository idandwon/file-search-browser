import { useSyncExternalStore } from 'react'
import { readLocalStorage } from '@/lib/shared/storage/browser-storage'
import {
  STORES_FAVORITES_ONLY_STORAGE_KEY,
  createStoresFavoritesOnlyStorage,
} from '@/lib/stores/preferences/stores-favorites-only-storage'

const DEFAULT_SNAPSHOT = false

let snapshot: boolean | undefined
let isListening = false

const listeners = new Set<() => void>()

const getStorage = () => createStoresFavoritesOnlyStorage()

const getSnapshot = (): boolean => {
  if (snapshot !== undefined) {
    return snapshot
  }

  snapshot = getStorage().load()

  return snapshot
}

const notifyListeners = (): void => {
  for (const listener of listeners) {
    listener()
  }
}

const setSnapshot = (nextSnapshot: boolean): void => {
  if (getSnapshot() === nextSnapshot) {
    return
  }

  snapshot = nextSnapshot
  notifyListeners()
}

const handleStorage = (event: StorageEvent): void => {
  const localStorage = readLocalStorage()

  if (!localStorage || event.storageArea !== localStorage) {
    return
  }

  if (event.key && event.key !== STORES_FAVORITES_ONLY_STORAGE_KEY) {
    return
  }

  setSnapshot(getStorage().load())
}

const startListening = (): void => {
  if (isListening || typeof window === 'undefined') {
    return
  }

  window.addEventListener('storage', handleStorage)
  isListening = true
}

const stopListening = (): void => {
  if (!isListening || listeners.size > 0 || typeof window === 'undefined') {
    return
  }

  window.removeEventListener('storage', handleStorage)
  isListening = false
}

const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener)
  startListening()

  return () => {
    listeners.delete(listener)
    stopListening()
  }
}

const setFavoritesOnly = (nextSnapshot: boolean): void => {
  getStorage().save(nextSnapshot)
  setSnapshot(nextSnapshot)
}

const toggleFavoritesOnly = (): void => {
  setFavoritesOnly(!getSnapshot())
}

const getServerSnapshot = (): boolean => DEFAULT_SNAPSHOT

export const useStoresFavoritesOnlyPreference = () => {
  const favoritesOnly = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  )

  return {
    favoritesOnly,
    setFavoritesOnly,
    toggleFavoritesOnly,
  } as const
}
