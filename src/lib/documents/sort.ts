import type { Document } from '@/lib/api/types'
import { getDocumentId } from '@/lib/documents/presentation'
import {
  getDocumentSortDirection,
  getDocumentSortField,
  type DocumentSortField,
  type DocumentSortValue,
} from '@/lib/documents/list-search'

const toTimestamp = (value?: string): number | null => {
  if (!value) {
    return null
  }

  const timestamp = Date.parse(value)
  return Number.isNaN(timestamp) ? null : timestamp
}

const getDocumentTimestamp = (
  document: Document,
  field: DocumentSortField,
): number | null =>
  toTimestamp(field === 'updated' ? document.updateTime : document.createTime)

const compareNullableTimestamps = (
  left: number | null,
  right: number | null,
): number => {
  if (left === right) return 0
  if (left === null) return 1
  if (right === null) return -1
  return left - right
}

export const sortDocumentsByDate = ({
  documents,
  sort,
}: {
  readonly documents: readonly Document[]
  readonly sort: DocumentSortValue
}): readonly Document[] => {
  const sortField = getDocumentSortField(sort)
  const direction = getDocumentSortDirection(sort)

  return [...documents].sort((left, right) => {
    const timestampComparison = compareNullableTimestamps(
      getDocumentTimestamp(left, sortField),
      getDocumentTimestamp(right, sortField),
    )

    if (timestampComparison !== 0) {
      return direction === 'asc' ? timestampComparison : -timestampComparison
    }

    return getDocumentId(left).localeCompare(getDocumentId(right))
  })
}
