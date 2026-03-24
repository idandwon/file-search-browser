import { useMutation } from '@tanstack/react-query'
import {
  uploadDocument,
  type UploadDocumentParams,
} from '@/lib/api/documents'
import { useGeminiClient } from '@/hooks/use-gemini-client'

export const useUploadDocument = (storeId: string) => {
  const client = useGeminiClient()

  return useMutation({
    mutationFn: ({ file, displayName }: UploadDocumentParams) =>
      uploadDocument(client, storeId, { file, displayName }),
  })
}
