import Dexie, { type Table } from 'dexie'
import {
  FAVORITE_STORES_STORAGE_KEY,
  clearLegacyFavoriteStoreIds,
  clearSessionFavoriteStoreIds,
  readLegacyFavoriteStoreIds,
  readSessionFavoriteStoreIds,
  sanitizeFavoriteStoreIds,
  selectFavoriteStoreMigrationSource,
  toggleFavoriteStoreIds,
} from './favorite-store-ids'

type FavoriteStoresState = {
  readonly key: typeof FAVORITE_STORES_STORAGE_KEY
  readonly storeIds: string[]
}

type FavoriteStoreIdsFallbackState = {
  readonly favoriteStoreIds: readonly string[]
  readonly useInMemoryFallback: boolean
}

class FavoritesDb extends Dexie {
  favoriteState!: Table<FavoriteStoresState, string>

  constructor() {
    super('file-search-browser')
    this.version(1).stores({
      favoriteState: '&key',
    })
  }
}

const favoritesDb = new FavoritesDb()

let fallbackState: FavoriteStoreIdsFallbackState = {
  favoriteStoreIds: [],
  useInMemoryFallback: false,
}

const fallbackListeners = new Set<() => void>()

let migrationPromise: Promise<void> | null = null

const notifyFallbackListeners = (): void => {
  for (const listener of fallbackListeners) {
    listener()
  }
}

const setFallbackState = (
  nextState: FavoriteStoreIdsFallbackState,
): FavoriteStoreIdsFallbackState => {
  const didChange =
    fallbackState.useInMemoryFallback !== nextState.useInMemoryFallback ||
    fallbackState.favoriteStoreIds.length !== nextState.favoriteStoreIds.length ||
    fallbackState.favoriteStoreIds.some(
      (storeId, index) => storeId !== nextState.favoriteStoreIds[index],
    )

  if (didChange) {
    fallbackState = nextState
    notifyFallbackListeners()
  }

  return fallbackState
}

const setIndexedDbAvailable = (): void => {
  if (!fallbackState.useInMemoryFallback) {
    return
  }

  setFallbackState({
    favoriteStoreIds: fallbackState.favoriteStoreIds,
    useInMemoryFallback: false,
  })
}

const setInMemoryFallbackStoreIds = (
  favoriteStoreIds: readonly string[],
): readonly string[] => {
  const sanitizedFavoriteStoreIds = sanitizeFavoriteStoreIds(favoriteStoreIds)

  setFallbackState({
    favoriteStoreIds: sanitizedFavoriteStoreIds,
    useInMemoryFallback: true,
  })

  return sanitizedFavoriteStoreIds
}

const readFavoriteStoreIdsRecord = async (): Promise<readonly string[]> => {
  try {
    const state = await favoritesDb.favoriteState.get(FAVORITE_STORES_STORAGE_KEY)
    const favoriteStoreIds = sanitizeFavoriteStoreIds(state?.storeIds ?? [])

    setIndexedDbAvailable()

    return favoriteStoreIds
  } catch {
    return setInMemoryFallbackStoreIds(fallbackState.favoriteStoreIds)
  }
}

const writeFavoriteStoreIdsRecord = async (
  favoriteStoreIds: readonly string[],
): Promise<readonly string[]> => {
  const sanitizedFavoriteStoreIds = sanitizeFavoriteStoreIds(favoriteStoreIds)

  try {
    await favoritesDb.favoriteState.put({
      key: FAVORITE_STORES_STORAGE_KEY,
      storeIds: [...sanitizedFavoriteStoreIds],
    })

    setIndexedDbAvailable()

    return sanitizedFavoriteStoreIds
  } catch {
    return setInMemoryFallbackStoreIds(sanitizedFavoriteStoreIds)
  }
}

export const subscribeToFavoriteStoreIdsFallback = (
  listener: () => void,
): (() => void) => {
  fallbackListeners.add(listener)

  return () => {
    fallbackListeners.delete(listener)
  }
}

export const favoriteStoreIdsFallbackSnapshot =
  (): FavoriteStoreIdsFallbackState => fallbackState

export const readFavoriteStoreIds = async (): Promise<readonly string[]> =>
  readFavoriteStoreIdsRecord()

export const migrateFavoriteStoreIds = async (): Promise<void> => {
  if (!migrationPromise) {
    migrationPromise = (async () => {
      const indexedDbFavoriteStoreIds = await readFavoriteStoreIdsRecord()
      const sessionFavoriteStoreIds = readSessionFavoriteStoreIds()
      const legacyFavoriteStoreIds = readLegacyFavoriteStoreIds()
      const favoriteStoreIdsToPersist = selectFavoriteStoreMigrationSource({
        indexedDbFavoriteStoreIds,
        sessionFavoriteStoreIds,
        legacyFavoriteStoreIds,
      })

      if (
        indexedDbFavoriteStoreIds.length === 0 &&
        favoriteStoreIdsToPersist.length > 0
      ) {
        await writeFavoriteStoreIdsRecord(favoriteStoreIdsToPersist)
      }

      clearSessionFavoriteStoreIds()
      clearLegacyFavoriteStoreIds()
    })()
  }

  await migrationPromise
}

export const toggleFavoriteStoreId = async (
  storeId: string,
): Promise<readonly string[]> => {
  const trimmedStoreId = storeId.trim()

  if (!trimmedStoreId) {
    return fallbackState.favoriteStoreIds
  }

  try {
    const nextFavoriteStoreIds = await favoritesDb.transaction(
      'rw',
      favoritesDb.favoriteState,
      async () => {
        const currentState = await favoritesDb.favoriteState.get(
          FAVORITE_STORES_STORAGE_KEY,
        )

        const currentFavoriteStoreIds = sanitizeFavoriteStoreIds(
          currentState?.storeIds ?? [],
        )
        const toggledFavoriteStoreIds = toggleFavoriteStoreIds(
          currentFavoriteStoreIds,
          trimmedStoreId,
        )

        await favoritesDb.favoriteState.put({
          key: FAVORITE_STORES_STORAGE_KEY,
          storeIds: [...toggledFavoriteStoreIds],
        })

        return toggledFavoriteStoreIds
      },
    )

    setIndexedDbAvailable()

    return nextFavoriteStoreIds
  } catch {
    const currentFavoriteStoreIds = fallbackState.useInMemoryFallback
      ? fallbackState.favoriteStoreIds
      : await readFavoriteStoreIdsRecord()
    const nextFavoriteStoreIds = toggleFavoriteStoreIds(
      currentFavoriteStoreIds,
      trimmedStoreId,
    )

    return setInMemoryFallbackStoreIds(nextFavoriteStoreIds)
  }
}
