import {
  MAX_FAVORITES,
  MAX_RESOURCE_ID_LENGTH,
} from './config'

export const FAVORITE_STORES_STORAGE_KEY = 'favorite-stores'
const EMPTY_FAVORITES_JSON = '[]'

const isValidFavoriteId = (value: unknown): value is string =>
  typeof value === 'string' &&
  value.length > 0 &&
  value.length <= MAX_RESOURCE_ID_LENGTH

export const sanitizeFavoriteStoreIds = (
  value: unknown,
): readonly string[] => {
  if (!Array.isArray(value)) {
    return []
  }

  const favorites: string[] = []
  const seen = new Set<string>()

  for (const entry of value) {
    if (!isValidFavoriteId(entry) || seen.has(entry)) {
      continue
    }

    favorites.push(entry)
    seen.add(entry)

    if (favorites.length >= MAX_FAVORITES) {
      break
    }
  }

  return favorites
}

export const toggleFavoriteStoreIds = (
  favoriteStoreIds: readonly string[],
  storeId: string,
): readonly string[] => {
  const nextFavoriteStoreIds = new Set(sanitizeFavoriteStoreIds(favoriteStoreIds))

  if (nextFavoriteStoreIds.has(storeId)) {
    nextFavoriteStoreIds.delete(storeId)
  } else {
    nextFavoriteStoreIds.add(storeId)
  }

  return sanitizeFavoriteStoreIds([...nextFavoriteStoreIds])
}

export const selectFavoriteStoreMigrationSource = ({
  indexedDbFavoriteStoreIds,
  sessionFavoriteStoreIds,
  legacyFavoriteStoreIds,
}: {
  readonly indexedDbFavoriteStoreIds: readonly string[]
  readonly sessionFavoriteStoreIds: readonly string[]
  readonly legacyFavoriteStoreIds: readonly string[]
}): readonly string[] => {
  if (indexedDbFavoriteStoreIds.length > 0) {
    return indexedDbFavoriteStoreIds
  }

  if (sessionFavoriteStoreIds.length > 0) {
    return sessionFavoriteStoreIds
  }

  return legacyFavoriteStoreIds
}

const readStoredFavorites = (storage: Storage | undefined): string => {
  try {
    return storage?.getItem(FAVORITE_STORES_STORAGE_KEY) ?? EMPTY_FAVORITES_JSON
  } catch {
    return EMPTY_FAVORITES_JSON
  }
}

const parseFavoriteStoreIds = (value: string): readonly string[] => {
  try {
    return sanitizeFavoriteStoreIds(JSON.parse(value))
  } catch {
    return []
  }
}

export const readLegacyFavoriteStoreIds = (): readonly string[] =>
  parseFavoriteStoreIds(readStoredFavorites(globalThis.localStorage))

export const readSessionFavoriteStoreIds = (): readonly string[] =>
  parseFavoriteStoreIds(readStoredFavorites(globalThis.sessionStorage))

export const clearLegacyFavoriteStoreIds = (): void => {
  try {
    globalThis.localStorage.removeItem(FAVORITE_STORES_STORAGE_KEY)
  } catch {
    return
  }
}

export const clearSessionFavoriteStoreIds = (): void => {
  try {
    globalThis.sessionStorage.removeItem(FAVORITE_STORES_STORAGE_KEY)
  } catch {
    return
  }
}
