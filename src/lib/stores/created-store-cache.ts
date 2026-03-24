import type { FileSearchStore } from '@/lib/api/types'
import { extractId } from '@/lib/api/file-search-resource'

type StoreMap = Map<string, FileSearchStore>

const getStoreKey = (store: FileSearchStore): string => store.name ?? ''

const hasStoreKey = (store: FileSearchStore): boolean => getStoreKey(store).length > 0

const hasStoreId = (store: FileSearchStore): boolean => extractId(store.name).length > 0

const setStore = (storeMap: StoreMap, store: FileSearchStore) => {
  const key = getStoreKey(store)
  if (!key || storeMap.has(key)) return
  storeMap.set(key, store)
}

const setStoreGroup = (storeMap: StoreMap, stores: readonly FileSearchStore[]) => {
  stores.forEach((store) => setStore(storeMap, store))
}

export const getStoreIdFromStore = (store: FileSearchStore): string => {
  if (!hasStoreKey(store) || !hasStoreId(store)) throw new Error('Created store is missing an ID.')
  return extractId(store.name)
}

export const mergeStoreLists = (
  ...groups: readonly (readonly FileSearchStore[])[]
): readonly FileSearchStore[] => {
  const storeMap: StoreMap = new Map()
  groups.forEach((group) => setStoreGroup(storeMap, group))
  return [...storeMap.values()]
}

export const appendCreatedStore = (
  stores: readonly FileSearchStore[],
  store: FileSearchStore,
): readonly FileSearchStore[] => mergeStoreLists([store], stores)
