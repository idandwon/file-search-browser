import { useMemo } from 'react'
import type { FileSearchStore } from '@/lib/api/types'
import { extractId } from '@/lib/api/file-search-resource'
import { searchStores } from '@/lib/stores/search'
import { mergeStoreLists } from '@/lib/stores/created-store-cache'

type UseVisibleStoresOptions = {
  readonly paginatedStores: readonly FileSearchStore[]
  readonly supplementalStores: readonly FileSearchStore[]
  readonly favoriteStores: readonly FileSearchStore[]
  readonly search: string
  readonly favoritesOnly: boolean
  readonly isFavorite: (storeId: string) => boolean
}

export const useVisibleStores = ({
  paginatedStores,
  supplementalStores,
  favoriteStores,
  search,
  favoritesOnly,
  isFavorite,
}: UseVisibleStoresOptions): readonly FileSearchStore[] => {
  const hasActiveSearch = search.trim().length > 0
  const shouldMergeMissingFavorites = favoritesOnly || !hasActiveSearch
  const leadingStores = useMemo(
    () =>
      shouldMergeMissingFavorites
        ? mergeStoreLists(supplementalStores, favoriteStores)
        : supplementalStores,
    [favoriteStores, supplementalStores, shouldMergeMissingFavorites],
  )
  const mergedStores = useMemo(() => {
    if (leadingStores.length === 0) return paginatedStores
    return mergeStoreLists(leadingStores, paginatedStores)
  }, [leadingStores, paginatedStores])

  const orderedStores = useMemo(() => {
    const favoriteResults: FileSearchStore[] = []
    const regularResults: FileSearchStore[] = []

    for (const store of mergedStores) {
      if (isFavorite(extractId(store.name))) {
        favoriteResults.push(store)
      } else {
        regularResults.push(store)
      }
    }

    return [...favoriteResults, ...regularResults]
  }, [isFavorite, mergedStores])

  const candidateStores = useMemo(
    () =>
      favoritesOnly
        ? orderedStores.filter((store) => isFavorite(extractId(store.name)))
        : orderedStores,
    [favoritesOnly, isFavorite, orderedStores],
  )

  return useMemo(
    () =>
      searchStores({
        items: candidateStores,
        query: search,
        isFavorite,
      }),
    [candidateStores, isFavorite, search],
  )
}
