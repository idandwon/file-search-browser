import type { StorageService } from './storage-service'

export const createBrowserStorage = (
  storage: Storage | undefined,
): StorageService => ({
  get: (key) => {
    try {
      return storage?.getItem(key) ?? null
    } catch {
      return null
    }
  },
  set: (key, value) => {
    try {
      storage?.setItem(key, value)
      return undefined
    } catch {
      return undefined
    }
  },
  remove: (key) => {
    try {
      storage?.removeItem(key)
      return undefined
    } catch {
      return undefined
    }
  },
})

export const readLocalStorage = (): Storage | undefined => {
  try {
    return globalThis.localStorage
  } catch {
    return undefined
  }
}

export const readSessionStorage = (): Storage | undefined => {
  try {
    return globalThis.sessionStorage
  } catch {
    return undefined
  }
}
