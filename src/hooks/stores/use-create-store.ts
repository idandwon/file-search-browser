import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createStore } from '@/lib/api/stores'
import type { FileSearchStore } from '@/lib/api/types'
import { queryKeys } from '@/lib/query/query-keys'
import {
  appendCreatedStore,
  getStoreIdFromStore,
} from '@/lib/stores/created-store-cache'
import { toCreateStoreInput } from '@/lib/stores/create-store-policy'
import { useGeminiClient } from '@/hooks/use-gemini-client'

type CreatedStoreResult = {
  readonly store: FileSearchStore
  readonly storeId: string
}

const toCreatedStoreResult = (store: FileSearchStore): CreatedStoreResult => ({
  store,
  storeId: getStoreIdFromStore(store),
})

const createStoreResult = async (
  client: ReturnType<typeof useGeminiClient>,
  value: string,
): Promise<CreatedStoreResult> => {
  const store = await createStore(client, toCreateStoreInput(value))
  return toCreatedStoreResult(store)
}

const cacheCreatedStore = (
  queryClient: ReturnType<typeof useQueryClient>,
  result: CreatedStoreResult,
) => {
  queryClient.setQueryData(queryKeys.store(result.storeId), result.store)
  queryClient.setQueryData(
    queryKeys.createdStores(),
    (stores: readonly FileSearchStore[] = []) =>
      appendCreatedStore(stores, result.store),
  )
}

const refreshStoreLists = (queryClient: ReturnType<typeof useQueryClient>) => {
  void queryClient.invalidateQueries({ queryKey: queryKeys.stores() })
}

export const useCreateStore = () => {
  const client = useGeminiClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (value: string) => createStoreResult(client, value),
    onSuccess: (result) => {
      cacheCreatedStore(queryClient, result)
      refreshStoreLists(queryClient)
    },
  })
}
