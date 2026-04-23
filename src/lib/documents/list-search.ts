import { normalizeListSearchValue, type ListSearch } from '@/lib/shared/search/list-search'

export type DocumentSortField = 'created' | 'updated'
export type DocumentSortDirection = 'asc' | 'desc'
export type DocumentSortValue =
  | 'created-desc'
  | 'created-asc'
  | 'updated-desc'
  | 'updated-asc'

export type DocumentListSearch = ListSearch & {
  readonly sort?: DocumentSortValue
}

export const DEFAULT_DOCUMENT_SORT: DocumentSortValue = 'created-desc'

export const DOCUMENT_SORT_OPTIONS: readonly {
  readonly value: DocumentSortValue
  readonly label: string
}[] = [
  { value: 'created-desc', label: 'Created: newest' },
  { value: 'created-asc', label: 'Created: oldest' },
  { value: 'updated-desc', label: 'Updated: newest' },
  { value: 'updated-asc', label: 'Updated: oldest' },
] as const

const DOCUMENT_SORT_VALUES = new Set<DocumentSortValue>(
  DOCUMENT_SORT_OPTIONS.map((option) => option.value),
)

const getSearchQueryValue = (search: unknown): unknown => {
  if (!search || typeof search !== 'object') {
    return undefined
  }

  return (search as { readonly q?: unknown }).q
}

const getSearchSortValue = (search: unknown): unknown => {
  if (!search || typeof search !== 'object') {
    return undefined
  }

  return (search as { readonly sort?: unknown }).sort
}

export const isDocumentSortValue = (value: unknown): value is DocumentSortValue =>
  typeof value === 'string' &&
  DOCUMENT_SORT_VALUES.has(value as DocumentSortValue)

export const normalizeDocumentSortValue = (
  value: unknown,
): DocumentSortValue | undefined => {
  if (!isDocumentSortValue(value)) {
    return undefined
  }

  return value
}

export const resolveDocumentSort = (
  value?: DocumentSortValue,
): DocumentSortValue => value ?? DEFAULT_DOCUMENT_SORT

export const getDocumentSortField = (
  value?: DocumentSortValue,
): DocumentSortField =>
  resolveDocumentSort(value).startsWith('updated') ? 'updated' : 'created'

export const getDocumentSortDirection = (
  value?: DocumentSortValue,
): DocumentSortDirection =>
  resolveDocumentSort(value).endsWith('-asc') ? 'asc' : 'desc'

export const getDocumentSortFieldLabel = (field: DocumentSortField): string =>
  field === 'updated' ? 'Updated' : 'Created'

export const getDocumentSortLabel = (value?: DocumentSortValue): string =>
  DOCUMENT_SORT_OPTIONS.find((option) => option.value === resolveDocumentSort(value))
    ?.label ?? DOCUMENT_SORT_OPTIONS[0].label

export const validateDocumentListSearch = (
  search: unknown,
): DocumentListSearch => {
  const q = normalizeListSearchValue(getSearchQueryValue(search))
  const sort = normalizeDocumentSortValue(getSearchSortValue(search))

  return {
    ...(q ? { q } : {}),
    ...(sort && sort !== DEFAULT_DOCUMENT_SORT ? { sort } : {}),
  }
}

export const buildDocumentListSearch = ({
  q,
  sort,
}: {
  readonly q: string
  readonly sort?: DocumentSortValue
}): DocumentListSearch => {
  const normalizedQuery = normalizeListSearchValue(q)
  const normalizedSort = normalizeDocumentSortValue(sort)

  return {
    ...(normalizedQuery ? { q: normalizedQuery } : {}),
    ...(normalizedSort && normalizedSort !== DEFAULT_DOCUMENT_SORT
      ? { sort: normalizedSort }
      : {}),
  }
}
