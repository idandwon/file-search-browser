const getResourceId = (value: string, resourceName: string): string => {
  const normalizedValue = value.trim()

  if (!normalizedValue) {
    throw new Error(`File search ${resourceName} is required.`)
  }

  return normalizedValue
}

export const extractId = (resourceName?: string): string => {
  if (!resourceName) return ''
  const segments = resourceName.split('/')
  return segments[segments.length - 1]
}

export const toFileSearchStoreResourceName = (storeId: string): string =>
  `fileSearchStores/${getResourceId(storeId, 'store ID')}`

export const toFileSearchDocumentResourceName = (
  storeId: string,
  documentId: string,
): string =>
  `${toFileSearchStoreResourceName(storeId)}/documents/${getResourceId(documentId, 'document ID')}`
