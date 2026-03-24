import {
  STORE_QUERY_DEFAULT_MODEL,
  STORE_QUERY_DEFAULT_PROMPT,
  isStoreQueryModel,
  type StoreQueryModel,
} from './config'
import { createStoreScopedPreference } from './store-scoped-preference'

export const STORE_QUERY_MODEL_STORAGE_KEY_PREFIX = 'store-query-model:v1:'
export const STORE_QUERY_PROMPT_STORAGE_KEY_PREFIX = 'store-query-prompt:v1:'

export const storeQueryModelPreference = createStoreScopedPreference<StoreQueryModel>({
  defaultValue: STORE_QUERY_DEFAULT_MODEL,
  storageKeyPrefix: STORE_QUERY_MODEL_STORAGE_KEY_PREFIX,
  parse: (value) => {
    if (!value || !isStoreQueryModel(value)) {
      return null
    }

    return value
  },
  serialize: (value) => value,
})

export const storeQueryPromptPreference = createStoreScopedPreference<string>({
  defaultValue: STORE_QUERY_DEFAULT_PROMPT,
  storageKeyPrefix: STORE_QUERY_PROMPT_STORAGE_KEY_PREFIX,
  parse: (value) => value,
  serialize: (value) => value,
})
