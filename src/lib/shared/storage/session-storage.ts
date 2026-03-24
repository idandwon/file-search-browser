import { createBrowserStorage, readSessionStorage } from './browser-storage'

export const createSessionStorage = (
  storage: Storage | undefined = readSessionStorage(),
) => createBrowserStorage(storage)
