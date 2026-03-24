import type { Accept } from 'react-dropzone'
import { formatBytes } from '@/lib/shared/format'

type FileValidationCode = 'unsupported_type' | 'file_too_large'

type FileValidationResult =
  | {
      readonly isValid: true
      readonly resolvedMimeType: string
      readonly uploadFile: File
    }
  | {
      readonly isValid: false
      readonly code: FileValidationCode
      readonly message: string
    }

export type RejectedFile = {
  readonly file: File
  readonly code: FileValidationCode
  readonly message: string
}

type CreateUploadPolicyParams = {
  readonly id: string
  readonly displayName: string
  readonly supportedMimeTypes: readonly string[]
  readonly extensionToMimeType?: Readonly<Record<string, string>>
  readonly fileNameToMimeType?: Readonly<Record<string, string>>
  readonly maxFileSizeBytes?: number
}

type UploadPolicy = {
  readonly id: string
  readonly displayName: string
  readonly dropzoneAccept: Accept
  readonly maxFileSizeBytes?: number
  readonly resolveMimeType: (file: File) => string | undefined
  readonly validateFile: (file: File) => FileValidationResult
}

const normalizeMimeType = (mimeType?: string): string =>
  mimeType?.trim().toLowerCase() ?? ''

const normalizeExtension = (extension: string): string =>
  extension.startsWith('.') ? extension.toLowerCase() : `.${extension.toLowerCase()}`

const fileExtension = (filename: string): string | undefined => {
  const index = filename.lastIndexOf('.')
  if (index < 0) return undefined

  return normalizeExtension(filename.slice(index))
}

const cloneFileWithMimeType = (file: File, mimeType: string): File =>
  new File([file], file.name, {
    type: mimeType,
    lastModified: file.lastModified,
  })

const unsupportedTypeMessage = (policy: Pick<UploadPolicy, 'displayName'>) =>
  `${policy.displayName} only accepts supported file types.`

const fileTooLargeMessage = (
  policy: Pick<UploadPolicy, 'maxFileSizeBytes'>,
) => {
  if (!policy.maxFileSizeBytes) return 'File exceeds the allowed size limit.'

  return `File exceeds the ${formatBytes(policy.maxFileSizeBytes)} limit.`
}

export const createUploadPolicy = ({
  id,
  displayName,
  supportedMimeTypes,
  extensionToMimeType = {},
  fileNameToMimeType = {},
  maxFileSizeBytes,
}: CreateUploadPolicyParams): UploadPolicy => {
  const mimeTypeSet = new Set(
    supportedMimeTypes.map((mimeType) => normalizeMimeType(mimeType)),
  )
  const extensionEntries = Object.entries(extensionToMimeType).map(
    ([extension, mimeType]) =>
      [normalizeExtension(extension), normalizeMimeType(mimeType)] as const,
  )
  const extensionToMimeTypeMap = new Map(
    extensionEntries.filter(([, mimeType]) => mimeTypeSet.has(mimeType)),
  )
  const fileNameToMimeTypeMap = new Map(
    Object.entries(fileNameToMimeType)
      .map(
        ([fileName, mimeType]) =>
          [fileName.toLowerCase(), normalizeMimeType(mimeType)] as const,
      )
      .filter(([, mimeType]) => mimeTypeSet.has(mimeType)),
  )
  const dropzoneAccept = Array.from(mimeTypeSet).reduce<Accept>(
    (accumulator, mimeType) => {
      accumulator[mimeType] = []
      return accumulator
    },
    {},
  )

  for (const [extension, mimeType] of extensionToMimeTypeMap.entries()) {
    const currentExtensions = dropzoneAccept[mimeType] ?? []

    dropzoneAccept[mimeType] = currentExtensions.includes(extension)
      ? currentExtensions
      : [...currentExtensions, extension]
  }

  const resolveMimeType = (file: File): string | undefined => {
    const mimeType = normalizeMimeType(file.type)
    if (mimeType && mimeTypeSet.has(mimeType)) return mimeType

    const mappedFileName = fileNameToMimeTypeMap.get(file.name.toLowerCase())
    if (mappedFileName) return mappedFileName

    const extension = fileExtension(file.name)
    if (!extension) return undefined

    return extensionToMimeTypeMap.get(extension)
  }

  return {
    id,
    displayName,
    dropzoneAccept,
    maxFileSizeBytes,
    resolveMimeType,
    validateFile: (file: File): FileValidationResult => {
      const resolvedMimeType = resolveMimeType(file)
      if (!resolvedMimeType) {
        return {
          isValid: false,
          code: 'unsupported_type',
          message: unsupportedTypeMessage({ displayName }),
        }
      }

      if (
        maxFileSizeBytes !== undefined &&
        maxFileSizeBytes > 0 &&
        file.size > maxFileSizeBytes
      ) {
        return {
          isValid: false,
          code: 'file_too_large',
          message: fileTooLargeMessage({ maxFileSizeBytes }),
        }
      }

      return {
        isValid: true,
        resolvedMimeType,
        uploadFile:
          normalizeMimeType(file.type) === resolvedMimeType
            ? file
            : cloneFileWithMimeType(file, resolvedMimeType),
      }
    },
  }
}
