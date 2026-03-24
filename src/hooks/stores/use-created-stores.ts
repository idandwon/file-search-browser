import { useQuery } from '@tanstack/react-query'
import type { FileSearchStore } from '@/lib/api/types'
import { queryKeys } from '@/lib/query/query-keys'

const loadCreatedStores = (): readonly FileSearchStore[] => []

export const useCreatedStores = (): readonly FileSearchStore[] =>
  useQuery({
    queryKey: queryKeys.createdStores(),
    queryFn: loadCreatedStores,
    initialData: [],
    staleTime: Infinity,
    gcTime: Infinity,
  }).data
