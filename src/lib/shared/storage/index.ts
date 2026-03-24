import { createLocalStorage as createLocalStorageImpl } from './local-storage'
import { createSessionStorage as createSessionStorageImpl } from './session-storage'

export type { StorageService } from './storage-service'

export const createLocalStorage = createLocalStorageImpl
export const createSessionStorage = createSessionStorageImpl
