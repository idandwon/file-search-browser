import type { CustomMetadata, Document } from '@/lib/api/types'
import { extractId } from '@/lib/api/file-search-resource'

export const getDocumentId = (document: Document): string =>
  extractId(document.name)

export const getDocumentDisplayName = (document: Document): string =>
  document.displayName || getDocumentId(document)

export const formatMetadataValue = (meta: CustomMetadata): string => {
  if (meta.stringValue !== undefined) return meta.stringValue
  if (meta.numericValue !== undefined) return String(meta.numericValue)
  if (meta.stringListValue?.values) return meta.stringListValue.values.join(', ')
  return '—'
}

export const stateVariant = (state?: string) => {
  if (state === 'STATE_ACTIVE') return 'default' as const
  if (state === 'STATE_PENDING') return 'secondary' as const
  return 'outline' as const
}
