import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteDocument } from '@/lib/api/documents'
import { queryKeys } from '@/lib/query/query-keys'
import { useGeminiClient } from '@/hooks/use-gemini-client'

export type DeleteDocumentsResult = {
  readonly deletedIds: readonly string[]
  readonly failedIds: readonly string[]
  readonly failuresById: Readonly<Record<string, Error>>
}

const toError = (error: unknown): Error =>
  error instanceof Error ? error : new Error('Document delete failed.')

const deleteDocuments = async (
  client: ReturnType<typeof useGeminiClient>,
  storeId: string,
  documentIds: readonly string[],
): Promise<DeleteDocumentsResult> => {
  const deletedIds: string[] = []
  const failuresById: Record<string, Error> = {}

  for (const documentId of documentIds) {
    try {
      await deleteDocument(client, storeId, documentId)
      deletedIds.push(documentId)
    } catch (error) {
      failuresById[documentId] = toError(error)
    }
  }

  return {
    deletedIds,
    failedIds: Object.keys(failuresById),
    failuresById,
  }
}

export const useDeleteDocuments = (storeId: string) => {
  const client = useGeminiClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (documentIds: readonly string[]) =>
      deleteDocuments(client, storeId, documentIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.documents(storeId) })
    },
  })
}
