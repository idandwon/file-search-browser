import Fuse, { type FuseOptionKey } from 'fuse.js'
import type { FileSearchStore } from '@/lib/api/types'
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

const STORE_SEARCH_CONFIG: SearchConfig<FileSearchStore> = {
  getId: (store) => extractId(store.name),
  fields: [
    {
      name: 'displayName',
      value: (store) => store.displayName,
      weight: 2,
    },
    {
      name: 'storeId',
      value: (store) => extractId(store.name),
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
  items: readonly FileSearchStore[],
  query: string,
): readonly SearchMatch<FileSearchStore>[] => {
  const normalizedQuery = query.trim()

  if (!normalizedQuery || items.length === 0) {
    return []
  }

  const { records, keys } = buildSearchRecords(items, STORE_SEARCH_CONFIG)

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

export const searchStores = ({
  items,
  query,
  isFavorite,
}: {
  readonly items: readonly FileSearchStore[]
  readonly query: string
  readonly isFavorite: (storeId: string) => boolean
}): readonly FileSearchStore[] => {
  const normalizedQuery = query.trim()

  if (!normalizedQuery) {
    return items
  }

  return [...findMatches(items, normalizedQuery)]
    .sort((left, right) => {
      if (left.score !== right.score) {
        return left.score - right.score
      }

      const leftFavorite = isFavorite(left.id)
      const rightFavorite = isFavorite(right.id)

      if (leftFavorite !== rightFavorite) {
        return leftFavorite ? -1 : 1
      }

      return left.originalIndex - right.originalIndex
    })
    .map(({ item }) => item)
}

export const hasStoreSearchMatch = ({
  items,
  query,
}: {
  readonly items: readonly FileSearchStore[]
  readonly query: string
}): boolean => findMatches(items, query).length > 0
