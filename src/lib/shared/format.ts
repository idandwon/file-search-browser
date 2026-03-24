const BYTE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB'] as const
const BYTE_STEP = 1024

export const formatBytes = (bytesValue?: string | number): string => {
  if (bytesValue === undefined || bytesValue === null || bytesValue === '') {
    return '—'
  }

  const bytes =
    typeof bytesValue === 'number' ? bytesValue : parseInt(bytesValue, 10)
  if (Number.isNaN(bytes) || bytes === 0) return '0 B'

  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(BYTE_STEP)),
    BYTE_UNITS.length - 1,
  )
  const value = bytes / Math.pow(BYTE_STEP, exponent)

  return `${value.toFixed(exponent === 0 ? 0 : 1)} ${BYTE_UNITS[exponent]}`
}

export const formatDate = (isoString?: string): string => {
  if (!isoString) return '—'

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(isoString))
}
