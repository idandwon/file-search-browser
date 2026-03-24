import { useCallback, useMemo, useState } from 'react'
import { useQueries } from '@tanstack/react-query'
import { fetchStore } from '@/lib/api/stores'
import { queryKeys } from '@/lib/query/query-keys'
import { useGeminiClient } from '@/hooks/use-gemini-client'
import { useFavorites } from './use-favorites'
import type { FileSearchStore } from '@/lib/api/types'

type UseFavoriteStoresOptions = {
  readonly enabled: boolean
  readonly limit: number
}

export const useFavoriteStores = ({
  enabled,
  limit,
}: UseFavoriteStoresOptions) => {
  const client = useGeminiClient()
  const { favorites } = useFavorites()
  const favoriteIds = useMemo(() => [...favorites], [favorites])
  const favoriteIdsKey = useMemo(() => favoriteIds.join('\u0000'), [favoriteIds])
  const visibleKey = enabled ? `${favoriteIdsKey}\u0001${limit}` : '__disabled__'
  const [visibleState, setVisibleState] = useState(() => ({
    key: visibleKey,
    count: limit,
  }))
  const visibleCount =
    visibleState.key === visibleKey ? visibleState.count : limit

  const hydratedFavoriteIds = useMemo(
    () => (enabled ? favoriteIds.slice(0, visibleCount) : []),
    [enabled, favoriteIds, visibleCount],
  )

  const hydratedFavorites = useQueries({
    queries: hydratedFavoriteIds.map((storeId) => ({
      queryKey: queryKeys.store(storeId),
      queryFn: () => fetchStore(client, storeId),
    })),
    combine: (results) => ({
      stores: results.flatMap((result) =>
        result.data !== undefined ? [result.data] : [],
      ) as readonly FileSearchStore[],
      isLoading: results.some((result) => result.isLoading),
      error: results.find((result) => result.error)?.error ?? null,
      refetch: () => {
        for (const result of results) {
          void result.refetch()
        }
      },
    }),
  })

  const hasMore = enabled && visibleCount < favoriteIds.length

  const loadMore = useCallback(() => {
    if (!enabled) {
      return
    }

    setVisibleState((current) => {
      const currentCount = current.key === visibleKey ? current.count : limit

      return {
        key: visibleKey,
        count: Math.min(currentCount + limit, favoriteIds.length),
      }
    })
  }, [enabled, favoriteIds.length, limit, visibleKey])

  return {
    stores: hydratedFavorites.stores,
    isLoading: hydratedFavorites.isLoading,
    error: hydratedFavorites.error,
    hasMore,
    loadMore,
    refetch: hydratedFavorites.refetch,
  } as const
}
