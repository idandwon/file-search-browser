import { useMemo } from 'react'
import type { Document } from '@/lib/api/types'
import { searchDocuments } from '@/lib/documents/search'

type UseVisibleDocumentsOptions = {
  readonly documents: readonly Document[]
  readonly search: string
}

export const useVisibleDocuments = ({
  documents,
  search,
}: UseVisibleDocumentsOptions): readonly Document[] => {
  return useMemo(
    () =>
      searchDocuments({
        items: documents,
        query: search,
      }),
    [documents, search],
  )
}
