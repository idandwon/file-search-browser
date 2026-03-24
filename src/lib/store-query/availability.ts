import type { FileSearchStore } from '@/lib/api/types'

export type StoreQueryAvailability = {
  readonly canQuery: boolean
  readonly description: string
  readonly isProcessing: boolean
  readonly title: string
}

const toCount = (value?: string): number => {
  const count = Number.parseInt(value ?? '', 10)
  return Number.isFinite(count) ? count : 0
}

const getActiveCount = (store?: FileSearchStore): number =>
  toCount(store?.activeDocumentsCount)

const getPendingCount = (store?: FileSearchStore): number =>
  toCount(store?.pendingDocumentsCount)

export const hasPendingDocuments = (store?: FileSearchStore): boolean =>
  getPendingCount(store) > 0

export const canQueryStore = (store?: FileSearchStore): boolean =>
  getActiveCount(store) > 0

export const getStoreQueryAvailability = (
  store?: FileSearchStore,
): StoreQueryAvailability => {
  if (canQueryStore(store)) {
    return {
      canQuery: true,
      isProcessing: hasPendingDocuments(store),
      title: '',
      description: '',
    } as const
  }

  if (hasPendingDocuments(store)) {
    return {
      canQuery: false,
      isProcessing: true,
      title: 'Documents are still processing',
      description: 'Querying will be available after at least one document becomes active.',
    } as const
  }

  return {
    canQuery: false,
    isProcessing: false,
    title: 'Upload documents first',
    description: 'Add at least one document to this store before running a query.',
  } as const
}
