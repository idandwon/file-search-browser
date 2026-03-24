import type { GoogleGenAI, Document } from '@google/genai'
import type { Pager } from '@google/genai'
import type { DocumentsResponse } from './types'
import {
  toFileSearchDocumentResourceName,
  toFileSearchStoreResourceName,
} from './file-search-resource'
import { DEFAULT_PAGE_SIZE } from './config'
import { geminiFileSearchUploadDisplayNamePolicy } from '@/lib/documents/upload/gemini-file-search-upload-display-name-policy'
import { geminiFileSearchUploadPolicy } from '@/lib/documents/upload/gemini-file-search-upload-policy'
import {
  splitFileName,
  validateProvidedDisplayName,
} from '@/lib/documents/upload/upload-display-name'

export type UploadDocumentParams = {
  readonly file: File
  readonly displayName?: string
}

const normalizePageToken = (pageToken?: string): string | undefined => {
  const normalizedPageToken = pageToken?.trim()
  return normalizedPageToken ? normalizedPageToken : undefined
}

const nextPageToken = <T>(pager: Pager<T>): string | undefined =>
  normalizePageToken(pager.params?.config?.pageToken)

export const fetchDocuments = async (
  client: GoogleGenAI,
  storeId: string,
  pageToken?: string,
  abortSignal?: AbortSignal,
): Promise<DocumentsResponse> => {
  const pager = await client.fileSearchStores.documents.list({
    parent: toFileSearchStoreResourceName(storeId),
    config: { abortSignal, pageSize: DEFAULT_PAGE_SIZE, pageToken },
  })

  return { documents: pager.page, nextPageToken: nextPageToken(pager) }
}

export const fetchDocument = async (
  client: GoogleGenAI,
  storeId: string,
  documentId: string,
): Promise<Document> =>
  client.fileSearchStores.documents.get({
    name: toFileSearchDocumentResourceName(storeId, documentId),
  })

export const uploadDocument = async (
  client: GoogleGenAI,
  storeId: string,
  { file, displayName }: UploadDocumentParams,
): Promise<void> => {
  const validation = geminiFileSearchUploadPolicy.validateFile(file)
  if (!validation.isValid) {
    throw new Error(validation.message)
  }

  const { extension } = splitFileName(file.name)
  const displayNameValidation = validateProvidedDisplayName(
    displayName ?? file.name,
    extension,
    geminiFileSearchUploadDisplayNamePolicy,
  )
  if (!displayNameValidation.ok) {
    throw new Error(displayNameValidation.message)
  }

  await client.fileSearchStores.uploadToFileSearchStore({
    fileSearchStoreName: toFileSearchStoreResourceName(storeId),
    file: validation.uploadFile,
    config: {
      displayName: displayNameValidation.displayName,
    },
  })
}

export const deleteDocument = async (
  client: GoogleGenAI,
  storeId: string,
  documentId: string,
): Promise<void> => {
  await client.fileSearchStores.documents.delete({
    name: toFileSearchDocumentResourceName(storeId, documentId),
    config: { force: true },
  })
}
