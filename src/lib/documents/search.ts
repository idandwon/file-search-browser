import Fuse, { type FuseOptionKey } from 'fuse.js'
import type { Document } from '@/lib/api/types'
import { extractId } from '@/lib/api/file-search-resource'

type SearchField<T> = {
  readonly name: string
  readonly value: (item: T) => string | null | undefined
  readonly weight?: number
}

type SearchConfig<T> = {
  readonly getId: (item: T, index: number) => string
  readonly fields: readonly SearchField<T>[]
}

type SearchRecord<T> = {
  readonly item: T
  readonly id: string
  readonly originalIndex: number
  readonly [key: string]: unknown
}

type SearchMatch<T> = {
  readonly item: T
  readonly id: string
  readonly originalIndex: number
  readonly score: number
}

const DEFAULT_THRESHOLD = 0.25

const DOCUMENT_SEARCH_CONFIG: SearchConfig<Document> = {
  getId: (document) => extractId(document.name),
  fields: [
    {
      name: 'displayName',
      value: (document) => document.displayName,
      weight: 2,
    },
    {
      name: 'documentId',
      value: (document) => extractId(document.name),
      weight: 1.5,
    },
  ],
}

const buildSearchRecords = <T>(
  items: readonly T[],
  config: SearchConfig<T>,
): {
  readonly records: readonly SearchRecord<T>[]
  readonly keys: FuseOptionKey<SearchRecord<T>>[]
} => {
  const fieldWeights = new Map<string, number>()

  const records = items.map((item, index) => {
    const record: Record<string, unknown> = {
      item,
      id: config.getId(item, index),
      originalIndex: index,
    }

    for (const field of config.fields) {
      const value = field.value(item)
      if (!value) {
        continue
      }

      record[field.name] = value

      const currentWeight = fieldWeights.get(field.name) ?? 0
      fieldWeights.set(field.name, Math.max(currentWeight, field.weight ?? 1))
    }

    return record as SearchRecord<T>
  })

  return {
    records,
    keys: Array.from(fieldWeights.entries()).map(([name, weight]) => ({
      name,
      weight,
    })),
  }
}

const findMatches = (
  items: readonly Document[],
  query: string,
): readonly SearchMatch<Document>[] => {
  const normalizedQuery = query.trim()

  if (!normalizedQuery || items.length === 0) {
    return []
  }

  const { records, keys } = buildSearchRecords(items, DOCUMENT_SEARCH_CONFIG)

  if (keys.length === 0) {
    return []
  }

  const fuse = new Fuse(records, {
    includeScore: true,
    ignoreLocation: true,
    shouldSort: true,
    threshold: DEFAULT_THRESHOLD,
    keys,
  })

  return fuse.search(normalizedQuery).map(({ item, score }) => ({
    item: item.item,
    id: item.id,
    originalIndex: item.originalIndex,
    score: score ?? 0,
  }))
}

export const searchDocuments = ({
  items,
  query,
}: {
  readonly items: readonly Document[]
  readonly query: string
}): readonly Document[] => {
  const normalizedQuery = query.trim()

  if (!normalizedQuery) {
    return items
  }

  return findMatches(items, normalizedQuery).map(({ item }) => item)
}

export const hasDocumentSearchMatch = ({
  items,
  query,
}: {
  readonly items: readonly Document[]
  readonly query: string
}): boolean => findMatches(items, query).length > 0
