import { useQuery } from '@tanstack/react-query'
import { fetchDocument } from '@/lib/api/documents'
import { queryKeys } from '@/lib/query/query-keys'
import { useGeminiClient } from '@/hooks/use-gemini-client'

export const useDocument = (storeId: string, documentId: string) => {
  const client = useGeminiClient()

  return useQuery({
    queryKey: queryKeys.document(storeId, documentId),
    queryFn: () => fetchDocument(client, storeId, documentId),
    enabled: !!storeId && !!documentId,
  })
}
