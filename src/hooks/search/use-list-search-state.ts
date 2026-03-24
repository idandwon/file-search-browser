import { useDebounce } from 'use-debounce'

type UseListSearchStateOptions = {
  readonly scopeKey: string
  readonly value: string
  readonly onChange: (value: string) => void
  readonly debounceMs?: number
}

export const useListSearchState = ({
  scopeKey,
  value,
  onChange,
  debounceMs = 300,
}: UseListSearchStateOptions) => {
  const [debouncedInputValue] = useDebounce(value, debounceMs)

  const normalizedInputValue = value.trim()
  const query = debouncedInputValue.trim()
  const hasActiveSearch = query.length > 0

  return {
    inputValue: value,
    setInputValue: onChange,
    query,
    hasActiveSearch,
    canRunSearchPagination:
      hasActiveSearch && normalizedInputValue === query,
    searchRunScopeKey: `${scopeKey}\u0000${value}`,
  } as const
}
