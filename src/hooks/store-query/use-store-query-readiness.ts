import { useCallback } from 'react'
import { useStore } from '@/hooks/stores/use-store'
import { getStoreQueryAvailability } from '@/lib/store-query/availability'
import { STORE_QUERY_POLL_INTERVAL_MS } from '@/lib/store-query/config'

const isStoreLoading = (status: string, hasData: boolean) =>
  status === 'pending' && !hasData

const getStoreError = (
  status: string,
  hasData: boolean,
  error: Error | null,
) => (status === 'error' && !hasData ? error : null)

export const useStoreQueryReadiness = (storeId: string) => {
  const store = useStore(storeId, { pollIntervalMs: STORE_QUERY_POLL_INTERVAL_MS })
  const retry = useCallback(() => {
    void store.refetch()
  }, [store])

  return {
    availability: getStoreQueryAvailability(store.data),
    error: getStoreError(store.status, !!store.data, store.error),
    isLoading: isStoreLoading(store.status, !!store.data),
    retry,
  } as const
}
