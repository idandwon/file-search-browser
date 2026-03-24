import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react'
import {
  favoriteStoreIdsFallbackSnapshot,
  migrateFavoriteStoreIds,
  readFavoriteStoreIds,
  subscribeToFavoriteStoreIdsFallback,
  toggleFavoriteStoreId,
} from '@/lib/stores/favorites/favorites-db'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  sanitizeFavoriteStoreIds,
} from '@/lib/stores/favorites/favorite-store-ids'

const getServerSnapshot = () => ({
  favoriteStoreIds: [] as readonly string[],
  useInMemoryFallback: false,
})

export const useFavorites = () => {
  const fallbackState = useSyncExternalStore(
    subscribeToFavoriteStoreIdsFallback,
    favoriteStoreIdsFallbackSnapshot,
    getServerSnapshot,
  )
  const indexedDbFavoriteStoreIds = useLiveQuery(
    () => readFavoriteStoreIds(),
    [],
    fallbackState.favoriteStoreIds,
  )

  useEffect(() => {
    void migrateFavoriteStoreIds()
  }, [])

  const favoriteIds = useMemo(
    () =>
      sanitizeFavoriteStoreIds(
        fallbackState.useInMemoryFallback
          ? fallbackState.favoriteStoreIds
          : indexedDbFavoriteStoreIds ?? fallbackState.favoriteStoreIds,
      ),
    [
      fallbackState.favoriteStoreIds,
      fallbackState.useInMemoryFallback,
      indexedDbFavoriteStoreIds,
    ],
  )
  const favorites = useMemo(() => new Set(favoriteIds), [favoriteIds])

  const isFavorite = useCallback(
    (storeId: string): boolean => favorites.has(storeId),
    [favorites],
  )

  const toggleFavorite = useCallback((storeId: string): void => {
    const trimmedStoreId = storeId.trim()

    if (!trimmedStoreId) {
      return
    }

    void toggleFavoriteStoreId(trimmedStoreId)
  }, [])

  return { favorites, isFavorite, toggleFavorite } as const
}
