export type ListQueryMode = 'browse' | 'search'

export const queryKeys = {
  createdStores: () => ['createdStores'] as const,
  stores: (mode?: ListQueryMode) =>
    mode === undefined ? ['stores'] as const : ['stores', mode] as const,
  store: (storeId: string) => ['store', storeId] as const,
  documents: (storeId: string, mode?: ListQueryMode) =>
    mode === undefined
      ? ['documents', storeId] as const
      : ['documents', storeId, mode] as const,
  document: (storeId: string, documentId: string) =>
    ['document', storeId, documentId] as const,
}
