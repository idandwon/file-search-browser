export type UploadDisplayNamePolicy = {
  readonly maxLength: number
  readonly preserveExtension: boolean
  readonly requireNonEmptyBaseName: boolean
}

export type UploadDisplayNameParts = {
  readonly baseName: string
  readonly extension: string
}

export type DisplayNameValidationResult =
  | {
      readonly ok: true
      readonly displayName: string
    }
  | {
      readonly ok: false
      readonly message: string
    }

const EMPTY_NAME_MESSAGE = 'Name cannot be empty.'

const fixedExtensionMessage = (extension: string) =>
  `Name must keep the original file extension ${extension}.`

const tooLongMessage = (
  allowedBaseNameLength: number,
  extension: string,
  maxLength: number,
) =>
  extension
    ? `Name must be ${allowedBaseNameLength} characters or fewer before ${extension}.`
    : `Name must be ${maxLength} characters or fewer.`

export const splitFileName = (fileName: string): UploadDisplayNameParts => {
  const extensionIndex = fileName.lastIndexOf('.')

  if (extensionIndex <= 0 || extensionIndex === fileName.length - 1) {
    return { baseName: fileName, extension: '' }
  }

  return {
    baseName: fileName.slice(0, extensionIndex),
    extension: fileName.slice(extensionIndex),
  }
}

export const normalizeBaseName = (baseName: string): string => baseName.trim()

export const maxBaseNameLength = (
  extension: string,
  policy: UploadDisplayNamePolicy,
): number =>
  Math.max(0, policy.maxLength - (policy.preserveExtension ? extension.length : 0))

export const composeDisplayName = (
  { baseName, extension }: UploadDisplayNameParts,
  policy: UploadDisplayNamePolicy,
): string =>
  `${normalizeBaseName(baseName)}${policy.preserveExtension ? extension : ''}`

export const validateDisplayName = (
  parts: UploadDisplayNameParts,
  policy: UploadDisplayNamePolicy,
): DisplayNameValidationResult => {
  const normalizedBaseName = normalizeBaseName(parts.baseName)

  if (policy.requireNonEmptyBaseName && normalizedBaseName.length === 0) {
    return { ok: false, message: EMPTY_NAME_MESSAGE }
  }

  const allowedBaseNameLength = maxBaseNameLength(parts.extension, policy)
  if (normalizedBaseName.length > allowedBaseNameLength) {
    return {
      ok: false,
      message: tooLongMessage(
        allowedBaseNameLength,
        parts.extension,
        policy.maxLength,
      ),
    }
  }

  const displayName = composeDisplayName(
    { baseName: normalizedBaseName, extension: parts.extension },
    policy,
  )

  if (displayName.length > policy.maxLength) {
    return {
      ok: false,
      message: tooLongMessage(
        allowedBaseNameLength,
        parts.extension,
        policy.maxLength,
      ),
    }
  }

  return { ok: true, displayName }
}

export const validateProvidedDisplayName = (
  displayName: string,
  extension: string,
  policy: UploadDisplayNamePolicy,
): DisplayNameValidationResult => {
  const normalizedDisplayName = displayName.trim()

  if (policy.preserveExtension && extension) {
    if (!normalizedDisplayName.endsWith(extension)) {
      return { ok: false, message: fixedExtensionMessage(extension) }
    }

    return validateDisplayName(
      {
        baseName: normalizedDisplayName.slice(0, -extension.length),
        extension,
      },
      policy,
    )
  }

  return validateDisplayName(
    { baseName: normalizedDisplayName, extension },
    policy,
  )
}
