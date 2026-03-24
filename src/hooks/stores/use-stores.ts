import { useCallback } from 'react'
import { fetchStores } from '@/lib/api/stores'
import { queryKeys, type ListQueryMode } from '@/lib/query/query-keys'
import { useGeminiClient } from '@/hooks/use-gemini-client'
import { useBoundedInfiniteList } from '@/hooks/query/use-bounded-infinite-list'

const getStoresFromPage = (page: Awaited<ReturnType<typeof fetchStores>>) =>
  page.fileSearchStores ?? []

type UseStoresOptions = {
  readonly enabled?: boolean
  readonly mode?: ListQueryMode
}

export const useStores = ({
  enabled = true,
  mode = 'browse',
}: UseStoresOptions = {}) => {
  const client = useGeminiClient()
  const fetchPage = useCallback(
    ({
      pageToken,
      signal,
    }: {
      readonly pageToken?: string
      readonly signal: AbortSignal
    }) => fetchStores(client, pageToken, signal),
    [client],
  )

  return useBoundedInfiniteList({
    queryKey: queryKeys.stores(mode),
    fetchPage,
    enabled,
    getItems: getStoresFromPage,
    retainFetchedPages: mode === 'search',
  })
}
