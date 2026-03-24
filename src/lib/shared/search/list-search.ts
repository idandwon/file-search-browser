export type ListSearch = {
  readonly q?: string
}

const getSearchQueryValue = (search: unknown): unknown => {
  if (!search || typeof search !== 'object') {
    return undefined
  }

  return (search as { readonly q?: unknown }).q
}

export const normalizeListSearchValue = (value: unknown): string | undefined => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return undefined
  }

  return value
}

export const validateListSearch = (search: unknown): ListSearch => {
  const q = normalizeListSearchValue(getSearchQueryValue(search))

  return q ? { q } : {}
}

export const buildListSearch = (value: string): ListSearch => {
  const q = normalizeListSearchValue(value)

  return q ? { q } : {}
}
