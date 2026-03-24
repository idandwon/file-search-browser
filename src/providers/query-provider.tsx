import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import { type ReactNode, useEffect, useMemo, useRef } from 'react'
import { useApiKey } from '@/hooks/use-api-key'
import { QUERY_STALE_TIME_MS } from '@/lib/query/policy'

const createQueryClient = (handleAuthError: (error: unknown) => boolean) =>
  new QueryClient({
    queryCache: new QueryCache({
      onError: (error) => {
        handleAuthError(error)
      },
    }),
    mutationCache: new MutationCache({
      onError: (error) => {
        handleAuthError(error)
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: QUERY_STALE_TIME_MS,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  })

export const QueryProvider = ({ children }: { readonly children: ReactNode }) => {
  const { apiKey, handleAuthError, status } = useApiKey()
  const authenticatedKey = status === 'authenticated' ? apiKey : null
  const sessionKey = authenticatedKey ?? 'anonymous'
  const previousClientRef = useRef<QueryClient | null>(null)
  const queryClient = useMemo(() => {
    void sessionKey
    return createQueryClient(handleAuthError)
  }, [handleAuthError, sessionKey])

  useEffect(() => {
    const previousClient = previousClientRef.current

    if (previousClient && previousClient !== queryClient) {
      previousClient.clear()
    }

    previousClientRef.current = queryClient

    return () => {
      queryClient.clear()
    }
  }, [queryClient])

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
