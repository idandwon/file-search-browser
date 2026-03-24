import { useCallback } from 'react'
import { fetchDocuments } from '@/lib/api/documents'
import { queryKeys, type ListQueryMode } from '@/lib/query/query-keys'
import { useGeminiClient } from '@/hooks/use-gemini-client'
import { useBoundedInfiniteList } from '@/hooks/query/use-bounded-infinite-list'

const getDocumentsFromPage = (page: Awaited<ReturnType<typeof fetchDocuments>>) =>
  page.documents ?? []

type UseDocumentsOptions = {
  readonly enabled?: boolean
  readonly mode?: ListQueryMode
}

export const useDocuments = (
  storeId: string,
  {
    enabled = true,
    mode = 'browse',
  }: UseDocumentsOptions = {},
) => {
  const client = useGeminiClient()
  const fetchPage = useCallback(
    ({
      pageToken,
      signal,
    }: {
      readonly pageToken?: string
      readonly signal: AbortSignal
    }) => fetchDocuments(client, storeId, pageToken, signal),
    [client, storeId],
  )

  return useBoundedInfiniteList({
    queryKey: queryKeys.documents(storeId, mode),
    fetchPage,
    enabled: enabled && !!storeId,
    getItems: getDocumentsFromPage,
    retainFetchedPages: mode === 'search',
  })
}
