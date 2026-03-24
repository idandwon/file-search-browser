import { useCallback } from 'react'
import { getRouteApi, useNavigate } from '@tanstack/react-router'
import { Database, SearchX, Star } from 'lucide-react'
import { useBackgroundSearchPagination } from '@/hooks/search/use-background-search-pagination'
import { useListSearchState } from '@/hooks/search/use-list-search-state'
import { useCreatedStores } from '@/hooks/stores/use-created-stores'
import { useFavoriteStores } from '@/hooks/stores/use-favorite-stores'
import { useFavorites } from '@/hooks/stores/use-favorites'
import { useStoresFavoritesOnlyPreference } from '@/hooks/stores/use-stores-favorites-only-preference'
import { useStores } from '@/hooks/stores/use-stores'
import { useVisibleStores } from '@/hooks/stores/use-visible-stores'
import { extractId } from '@/lib/api/file-search-resource'
import { hasStoreSearchMatch } from '@/lib/stores/search'
import { buildListSearch } from '@/lib/shared/search/list-search'
import { MAX_FAVORITE_BATCH, MAX_FAVORITES } from '@/lib/stores/favorites/config'
import { Button } from '@/components/ui/button'
import { StoreCard } from './store-card'
import { StoreListSkeleton } from './store-list-skeleton'
import { ScrollTrigger } from '@/components/shared/scroll-trigger'
import { SearchInput } from '@/components/shared/search-input'
import { EmptyState } from '@/components/shared/empty-state'
import { ErrorDisplay } from '@/components/shared/error-display'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { SearchLoadMoreAction } from '@/components/shared/search-load-more-action'

const DEBOUNCE_MS = 300
const storesRouteApi = getRouteApi('/')

export const StoreList = () => {
  const navigate = useNavigate({ from: '/' })
  const { q } = storesRouteApi.useSearch()
  const { favoritesOnly, toggleFavoritesOnly } =
    useStoresFavoritesOnlyPreference()
  const { isFavorite, toggleFavorite } = useFavorites()
  const setSearch = useCallback(
    (nextValue: string) => {
      void navigate({
        replace: true,
        search: buildListSearch(nextValue),
      })
    },
    [navigate],
  )
  const {
    inputValue: search,
    setInputValue: setSearchInputValue,
    query: searchQuery,
    hasActiveSearch,
    canRunSearchPagination,
    searchRunScopeKey,
  } = useListSearchState({
    scopeKey: favoritesOnly ? 'favorites' : 'all',
    value: q ?? '',
    onChange: setSearch,
    debounceMs: DEBOUNCE_MS,
  })
  const favoriteHydrationLimit = favoritesOnly ? MAX_FAVORITE_BATCH : MAX_FAVORITES
  const {
    stores: favoriteStores,
    isLoading: isFavoriteStoresLoading,
    error: favoriteStoresError,
    hasMore: hasMoreFavoriteStores,
    loadMore: loadMoreFavoriteStores,
    refetch: refetchFavoriteStores,
  } = useFavoriteStores({
    enabled: true,
    limit: favoriteHydrationLimit,
  })
  const browseStoresQuery = useStores({ mode: 'browse' })
  const isSearchQueryEnabled = hasActiveSearch && !favoritesOnly
  const searchStoresQuery = useStores({
    mode: 'search',
    enabled: isSearchQueryEnabled,
  })
  const createdStores = useCreatedStores()
  const isSearchBootstrapLoading =
    isSearchQueryEnabled &&
    searchStoresQuery.status === 'pending' &&
    searchStoresQuery.loadedPageCount === 0
  const activeStoresQuery = isSearchQueryEnabled
    ? searchStoresQuery
    : browseStoresQuery
  const serverStores = isSearchQueryEnabled
    ? searchStoresQuery.items
    : browseStoresQuery.items
  const stores = useVisibleStores({
    paginatedStores: serverStores,
    supplementalStores: createdStores,
    favoriteStores,
    search: searchQuery,
    favoritesOnly,
    isFavorite,
  })
  const serverVisibleStores = useVisibleStores({
    paginatedStores: serverStores,
    supplementalStores: [],
    favoriteStores,
    search: searchQuery,
    favoritesOnly,
    isFavorite,
  })
  const backgroundSearch = useBackgroundSearchPagination({
    isSearchActive: canRunSearchPagination && !favoritesOnly,
    runScopeKey: searchRunScopeKey,
    hasLoadedMatch: isSearchQueryEnabled && serverVisibleStores.length > 0,
    hasNextPage: activeStoresQuery.hasNextPage,
    isFetchingNextPage: activeStoresQuery.isFetchingNextPage,
    loadedPageCount: activeStoresQuery.loadedPageCount,
    nextCursor: activeStoresQuery.nextCursor,
    dataUpdatedAt: activeStoresQuery.dataUpdatedAt,
    query: searchQuery,
    fetchNextPage: () => searchStoresQuery.fetchNextPage({ cancelRefetch: false }),
    pageContainsMatch: (page, query) => hasStoreSearchMatch({
      items: page.fileSearchStores ?? [],
      query,
    }),
  })
  if (!isSearchQueryEnabled && browseStoresQuery.status === 'pending') {
    return <StoreListSkeleton />
  }

  if (!isSearchQueryEnabled && browseStoresQuery.status === 'error') {
    return (
      <ErrorDisplay
        error={browseStoresQuery.error}
        onRetry={() => browseStoresQuery.refetch()}
      />
    )
  }

  if (
    isSearchQueryEnabled &&
    searchStoresQuery.status === 'error' &&
    searchStoresQuery.loadedPageCount === 0
  ) {
    return (
      <ErrorDisplay
        error={searchStoresQuery.error}
        onRetry={() => searchStoresQuery.refetch()}
      />
    )
  }

  if (favoritesOnly && isFavoriteStoresLoading && stores.length === 0) {
    return <StoreListSkeleton />
  }

  if (favoritesOnly && favoriteStoresError && stores.length === 0) {
    return (
      <ErrorDisplay
        error={favoriteStoresError}
        onRetry={() => refetchFavoriteStores()}
      />
    )
  }

  const emptyIcon = hasActiveSearch ? SearchX : favoritesOnly ? Star : Database
  const emptyTitle = hasActiveSearch
    ? 'No stores match your search'
    : favoritesOnly
      ? 'No favorite stores yet'
      : 'No stores found'
  const emptyDescription = hasActiveSearch
    ? 'Try a different search term.'
    : favoritesOnly
      ? 'Star a store to add it to your favorites.'
      : 'Create a store to get started.'
  const searchLoadMoreAction =
    !favoritesOnly &&
    hasActiveSearch &&
    (backgroundSearch.isLoading || backgroundSearch.canManualLoadMore)
      ? (
          <SearchLoadMoreAction
            isLoading={backgroundSearch.isLoading}
            canLoadMore={backgroundSearch.canManualLoadMore}
            onLoadMore={backgroundSearch.start}
          />
        )
      : undefined
  const isBackgroundSearchLoadingWithoutResults =
    isSearchQueryEnabled &&
    stores.length === 0 &&
    (
      backgroundSearch.isLoading ||
      (
        activeStoresQuery.hasNextPage === true &&
        backgroundSearch.runState !== 'exhausted' &&
        backgroundSearch.runState !== 'error'
      )
    )
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <SearchInput
            value={search}
            onChange={setSearchInputValue}
            placeholder="Search stores by name or ID..."
          />
        </div>
        <Button
          variant={favoritesOnly ? 'default' : 'outline'}
          size="icon"
          onClick={toggleFavoritesOnly}
          aria-label="Show favorites only"
          aria-pressed={favoritesOnly}
        >
          <Star className={`h-4 w-4 ${favoritesOnly ? 'fill-current' : ''}`} />
        </Button>
      </div>

      {isSearchBootstrapLoading ? (
        <div className="flex min-h-40 items-center justify-center">
          <LoadingSpinner label="Searching stores" />
        </div>
      ) : isBackgroundSearchLoadingWithoutResults ? (
        <div className="flex min-h-40 items-center justify-center">
          <LoadingSpinner label="Searching more stores..." />
        </div>
      ) : stores.length === 0 ? (
        <EmptyState
          icon={emptyIcon}
          title={emptyTitle}
          description={emptyDescription}
          action={searchLoadMoreAction}
        />
      ) : (
        <div className="flex flex-col gap-4">
          {stores.map((store) => (
            <StoreCard
              key={store.name}
              store={store}
              isFavorite={isFavorite(extractId(store.name))}
              onToggleFavorite={toggleFavorite}
            />
          ))}
          {!favoritesOnly ? (
            <ScrollTrigger
              enabled={!hasActiveSearch && browseStoresQuery.hasNextPage === true}
              isFetching={!hasActiveSearch && browseStoresQuery.isFetchingNextPage}
              onAutoLoadMore={() => {
                void browseStoresQuery.fetchNextPage()
              }}
              footer={searchLoadMoreAction}
            />
          ) : null}
          {favoritesOnly && hasMoreFavoriteStores ? (
            <div className="flex justify-center py-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={loadMoreFavoriteStores}
              >
                Load more favorites
              </Button>
            </div>
          ) : null}
          {activeStoresQuery.isFetching && !activeStoresQuery.isFetchingNextPage ? (
            <div className="flex min-h-8 items-center justify-center">
              <LoadingSpinner label="Refreshing stores" />
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
