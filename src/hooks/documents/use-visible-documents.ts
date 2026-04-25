import { useMemo } from 'react'
import type { Document } from '@/lib/api/types'
import { type DocumentSortValue } from '@/lib/documents/list-search'
import { searchDocuments } from '@/lib/documents/search'
import { sortDocumentsByDate } from '@/lib/documents/sort'

type UseVisibleDocumentsOptions = {
  readonly documents: readonly Document[]
  readonly search: string
  readonly sort: DocumentSortValue
}

export const useVisibleDocuments = ({
  documents,
  search,
  sort,
}: UseVisibleDocumentsOptions): readonly Document[] => {
  return useMemo(
    () => {
      const filteredDocuments = searchDocuments({
        items: documents,
        query: search,
      })

      return sortDocumentsByDate({
        documents: filteredDocuments,
        sort,
      })
    },
    [documents, search, sort],
  )
}
