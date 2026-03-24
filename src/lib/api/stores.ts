import type { GoogleGenAI, FileSearchStore } from '@google/genai'
import type { Pager } from '@google/genai'
import type { StoresResponse } from './types'
import { DEFAULT_PAGE_SIZE } from './config'
import { toFileSearchStoreResourceName } from './file-search-resource'

export type CreateStoreParams = {
  readonly displayName?: string
}

const normalizePageToken = (pageToken?: string): string | undefined => {
  const normalizedPageToken = pageToken?.trim()
  return normalizedPageToken ? normalizedPageToken : undefined
}

const nextPageToken = <T>(pager: Pager<T>): string | undefined =>
  normalizePageToken(pager.params?.config?.pageToken)

export const fetchStores = async (
  client: GoogleGenAI,
  pageToken?: string,
  abortSignal?: AbortSignal,
): Promise<StoresResponse> => {
  const pager = await client.fileSearchStores.list({
    config: { abortSignal, pageSize: DEFAULT_PAGE_SIZE, pageToken },
  })

  return { fileSearchStores: pager.page, nextPageToken: nextPageToken(pager) }
}

export const fetchStore = async (
  client: GoogleGenAI,
  storeId: string,
): Promise<FileSearchStore> =>
  client.fileSearchStores.get({ name: toFileSearchStoreResourceName(storeId) })

export const createStore = async (
  client: GoogleGenAI,
  { displayName }: CreateStoreParams,
): Promise<FileSearchStore> =>
  client.fileSearchStores.create({ config: { displayName } })
