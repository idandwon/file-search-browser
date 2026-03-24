export type {
  FileSearchStore,
  Document,
  CustomMetadata,
  DocumentState,
} from '@google/genai'

import type { FileSearchStore, Document } from '@google/genai'

export type StoresResponse = {
  readonly fileSearchStores?: FileSearchStore[]
  readonly nextPageToken?: string
}

export type DocumentsResponse = {
  readonly documents?: Document[]
  readonly nextPageToken?: string
}
