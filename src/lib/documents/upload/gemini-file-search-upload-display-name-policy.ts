import type { UploadDisplayNamePolicy } from './upload-display-name'

export const geminiFileSearchUploadDisplayNamePolicy: UploadDisplayNamePolicy = {
  maxLength: 512,
  preserveExtension: true,
  requireNonEmptyBaseName: true,
}
