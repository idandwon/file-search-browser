import { useQuery } from '@tanstack/react-query'
import { fetchStore } from '@/lib/api/stores'
import { queryKeys } from '@/lib/query/query-keys'
import { hasPendingDocuments } from '@/lib/store-query/availability'
import { useGeminiClient } from '@/hooks/use-gemini-client'

type UseStoreOptions = {
  readonly pollIntervalMs?: number
}

export const useStore = (
  storeId: string,
  { pollIntervalMs }: UseStoreOptions = {},
) => {
  const client = useGeminiClient()

  return useQuery({
    queryKey: queryKeys.store(storeId),
    queryFn: () => fetchStore(client, storeId),
    enabled: !!storeId,
    refetchInterval: (query) =>
      pollIntervalMs && hasPendingDocuments(query.state.data)
        ? pollIntervalMs
        : false,
  })
}
