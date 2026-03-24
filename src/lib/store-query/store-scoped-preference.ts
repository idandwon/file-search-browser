import { createLocalStorage } from '@/lib/shared/storage'
import { readLocalStorage } from '@/lib/shared/storage/browser-storage'

export type StoreScopedPreferenceDescriptor<T> = {
  readonly defaultValue: T
  readonly storageKeyPrefix: string
  readonly parse: (value: string | null) => T | null
  readonly serialize: (value: T) => string
}

export type StoreScopedPreference<T> = {
  readonly defaultValue: T
  readonly getSnapshot: (storeId: string) => T
  readonly reset: (storeId: string) => void
  readonly save: (storeId: string, value: T) => void
  readonly subscribe: (storeId: string, listener: () => void) => () => void
}

const createStoreListeners = (): Set<() => void> => new Set()

const toStorageKey = (storageKeyPrefix: string, storeId: string): string =>
  `${storageKeyPrefix}${storeId}`

const getStoreIdFromKey = (key: string | null, storageKeyPrefix: string): string => {
  if (!key?.startsWith(storageKeyPrefix)) {
    return ''
  }

  return key.slice(storageKeyPrefix.length)
}

const isLocalStorageEvent = (event: StorageEvent): boolean => {
  const localStorage = readLocalStorage()

  if (!localStorage) {
    return false
  }

  return event.storageArea === localStorage
}

export const createStoreScopedPreference = <T>(
  descriptor: StoreScopedPreferenceDescriptor<T>,
): StoreScopedPreference<T> => {
  const storage = createLocalStorage()
  const listeners = new Map<string, Set<() => void>>()
  const snapshots = new Map<string, T>()

  let isListening = false

  const loadSnapshot = (storeId: string): T => {
    const value = descriptor.parse(
      storage.get(toStorageKey(descriptor.storageKeyPrefix, storeId)),
    )
    const snapshot = value ?? descriptor.defaultValue

    snapshots.set(storeId, snapshot)
    return snapshot
  }

  const readSnapshot = (storeId: string): T => {
    const snapshot = snapshots.get(storeId)

    if (snapshot !== undefined) {
      return snapshot
    }

    return loadSnapshot(storeId)
  }

  const getStoreListeners = (storeId: string): Set<() => void> => {
    const storeListeners = listeners.get(storeId)

    if (storeListeners) {
      return storeListeners
    }

    const nextListeners = createStoreListeners()
    listeners.set(storeId, nextListeners)
    return nextListeners
  }

  const notifyStoreListeners = (storeId: string): void => {
    for (const listener of getStoreListeners(storeId)) {
      listener()
    }
  }

  const updateSnapshot = (storeId: string, value: T): void => {
    if (Object.is(readSnapshot(storeId), value)) {
      return
    }

    snapshots.set(storeId, value)
    notifyStoreListeners(storeId)
  }

  const handleStorage = (event: StorageEvent): void => {
    if (!isLocalStorageEvent(event)) {
      return
    }

    const storeId = getStoreIdFromKey(event.key, descriptor.storageKeyPrefix)

    if (!storeId) {
      return
    }

    updateSnapshot(storeId, loadSnapshot(storeId))
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

  const unsubscribe = (storeId: string, listener: () => void): void => {
    const storeListeners = getStoreListeners(storeId)

    storeListeners.delete(listener)

    if (storeListeners.size === 0) {
      listeners.delete(storeId)
      stopListening()
    }
  }

  return {
    defaultValue: descriptor.defaultValue,
    getSnapshot: (storeId: string): T => readSnapshot(storeId),
    reset: (storeId: string): void => {
      storage.remove(toStorageKey(descriptor.storageKeyPrefix, storeId))
      updateSnapshot(storeId, descriptor.defaultValue)
    },
    save: (storeId: string, value: T): void => {
      storage.set(
        toStorageKey(descriptor.storageKeyPrefix, storeId),
        descriptor.serialize(value),
      )
      updateSnapshot(storeId, value)
    },
    subscribe: (storeId: string, listener: () => void): (() => void) => {
      const storeListeners = getStoreListeners(storeId)

      storeListeners.add(listener)
      startListening()

      return () => unsubscribe(storeId, listener)
    },
  }
}
