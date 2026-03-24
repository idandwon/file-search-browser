import { createBrowserStorage, readLocalStorage } from './browser-storage'

export const createLocalStorage = (
  storage: Storage | undefined = readLocalStorage(),
) => createBrowserStorage(storage)
