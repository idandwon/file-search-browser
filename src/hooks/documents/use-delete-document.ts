import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteDocument } from '@/lib/api/documents'
import { queryKeys } from '@/lib/query/query-keys'
import { useGeminiClient } from '@/hooks/use-gemini-client'

export const useDeleteDocument = (storeId: string) => {
  const client = useGeminiClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (documentId: string) => deleteDocument(client, storeId, documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.documents(storeId) })
    },
  })
}
