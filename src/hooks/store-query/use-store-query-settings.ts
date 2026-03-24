import { useCallback, useSyncExternalStore } from 'react'
import {
  storeQueryModelPreference,
  storeQueryPromptPreference,
} from '@/lib/store-query/preferences'
import {
  STORE_QUERY_DEFAULT_MODEL,
  STORE_QUERY_DEFAULT_PROMPT,
  type StoreQueryModel,
} from '@/lib/store-query/config'
import type { StoreScopedPreference } from '@/lib/store-query/store-scoped-preference'

const useStoreScopedPreference = <T>(
  storeId: string,
  preference: StoreScopedPreference<T>,
) => {
  const value = useSyncExternalStore(
    (listener) => preference.subscribe(storeId, listener),
    () => preference.getSnapshot(storeId),
    () => preference.defaultValue,
  )
  const save = useCallback(
    (nextValue: T) => preference.save(storeId, nextValue),
    [preference, storeId],
  )
  const reset = useCallback(() => preference.reset(storeId), [preference, storeId])

  return { reset, save, value } as const
}

export const useStoreQuerySettings = (storeId: string) => {
  const model = useStoreScopedPreference(storeId, storeQueryModelPreference)
  const prompt = useStoreScopedPreference(storeId, storeQueryPromptPreference)
  const setModel = useCallback(
    (nextModel: StoreQueryModel) => {
      if (nextModel === STORE_QUERY_DEFAULT_MODEL) {
        model.reset()
        return
      }

      model.save(nextModel)
    },
    [model],
  )
  const setPrompt = useCallback(
    (nextPrompt: string) => {
      if (nextPrompt === STORE_QUERY_DEFAULT_PROMPT) {
        prompt.reset()
        return
      }

      prompt.save(nextPrompt)
    },
    [prompt],
  )

  return {
    model: model.value,
    prompt: prompt.value,
    setModel,
    setPrompt,
  } as const
}
