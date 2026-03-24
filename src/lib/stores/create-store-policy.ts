export const MAX_STORE_DISPLAY_NAME_LENGTH = 512

export type CreateStoreInput = {
  readonly displayName: string
}

export const normalizeStoreDisplayName = (value: string): string => value.trim()

export const hasStoreDisplayName = (value: string): boolean =>
  normalizeStoreDisplayName(value).length > 0

export const isStoreDisplayNameTooLong = (value: string): boolean =>
  normalizeStoreDisplayName(value).length > MAX_STORE_DISPLAY_NAME_LENGTH

export const getCreateStoreError = (value: string): string | null => {
  if (!hasStoreDisplayName(value)) return 'Enter a store name.'
  if (!isStoreDisplayNameTooLong(value)) return null
  return `Store name must be ${MAX_STORE_DISPLAY_NAME_LENGTH} characters or fewer.`
}

export const toCreateStoreInput = (value: string): CreateStoreInput => {
  const displayName = normalizeStoreDisplayName(value)
  const error = getCreateStoreError(displayName)
  if (error) throw new Error(error)
  return { displayName }
}
