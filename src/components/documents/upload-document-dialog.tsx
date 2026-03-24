import { useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Upload, AlertCircle, Loader2 } from 'lucide-react'
import {
  ErrorCode,
  useDropzone,
  type FileError,
  type FileRejection,
} from 'react-dropzone'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { UploadQueueItemRow } from './upload-queue-item-row'
import { useUploadDocument } from '@/hooks/documents/use-upload-document'
import { useUploadQueue } from '@/hooks/documents/use-upload-queue'
import { geminiFileSearchUploadDisplayNamePolicy } from '@/lib/documents/upload/gemini-file-search-upload-display-name-policy'
import { geminiFileSearchUploadPolicy } from '@/lib/documents/upload/gemini-file-search-upload-policy'
import { type RejectedFile } from '@/lib/documents/upload/upload-policy'
import { composeDisplayName } from '@/lib/documents/upload/upload-display-name'
import { queryKeys } from '@/lib/query/query-keys'
import { cn } from '@/lib/utils'
import { formatBytes } from '@/lib/shared/format'

const validationErrorToRejectedFile = (
  file: File,
  error?: FileError,
): RejectedFile => {
  const validation = geminiFileSearchUploadPolicy.validateFile(file)

  if (!validation.isValid) {
    return {
      file,
      code: validation.code,
      message: validation.message,
    }
  }

  return {
    file,
    code:
      error?.code === ErrorCode.FileTooLarge
        ? 'file_too_large'
        : 'unsupported_type',
    message: error?.message ?? 'File was rejected.',
  }
}

const toRejectedFiles = (
  fileRejections: readonly FileRejection[],
): RejectedFile[] =>
  fileRejections.map(({ file, errors }) =>
    validationErrorToRejectedFile(file, errors[0]),
  )

type UploadDocumentDialogProps = {
  readonly storeId: string
  readonly trigger: React.ReactNode
}

export const UploadDocumentDialog = ({
  storeId,
  trigger,
}: UploadDocumentDialogProps) => {
  const [open, setOpen] = useState(false)
  const [rejectedFiles, setRejectedFiles] = useState<RejectedFile[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const queryClient = useQueryClient()
  const { mutateAsync } = useUploadDocument(storeId)
  const {
    items: fileItems,
    uploadableItems,
    uploadableCount,
    allDone,
    addFiles,
    updateBaseName,
    removeFile,
    markUploading,
    markDone,
    markFailed,
    reset,
  } = useUploadQueue(geminiFileSearchUploadDisplayNamePolicy)

  const handleFilesSelected = useCallback(
    (files: File[]) => {
      addFiles(files)
    },
    [addFiles],
  )

  const {
    getInputProps,
    getRootProps,
    isDragActive,
    isDragReject,
    open: openFileDialog,
  } = useDropzone({
    noClick: true,
    disabled: isUploading,
    multiple: true,
    accept: geminiFileSearchUploadPolicy.dropzoneAccept,
    validator: (file) => {
      const validation = geminiFileSearchUploadPolicy.validateFile(file)

      if (validation.isValid) {
        return null
      }

      return {
        code: validation.code,
        message: validation.message,
      }
    },
    onDrop: (acceptedFiles, fileRejections) => {
      if (acceptedFiles.length > 0) {
        handleFilesSelected(acceptedFiles)
      }

      setRejectedFiles(toRejectedFiles(fileRejections))
    },
  })

  const uploadAll = useCallback(async () => {
    if (uploadableItems.length === 0) return

    setIsUploading(true)
    let successCount = 0

    try {
      for (const item of uploadableItems) {
        markUploading(item.id)

        try {
          await mutateAsync({
            file: item.file,
            displayName: composeDisplayName(
              {
                baseName: item.baseName,
                extension: item.extension,
              },
              geminiFileSearchUploadDisplayNamePolicy,
            ),
          })
          successCount += 1
          markDone(item.id)
        } catch (err) {
          markFailed(
            item.id,
            err instanceof Error ? err.message : 'Upload failed',
          )
        }
      }

      if (successCount > 0) {
        await queryClient.invalidateQueries({
          queryKey: queryKeys.documents(storeId),
        })
        await queryClient.invalidateQueries({
          queryKey: queryKeys.store(storeId),
        })
        await queryClient.invalidateQueries({
          queryKey: queryKeys.stores(),
        })
      }
    } finally {
      setIsUploading(false)
    }
  }, [
    uploadableItems,
    markUploading,
    mutateAsync,
    markDone,
    markFailed,
    queryClient,
    storeId,
  ])

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        reset()
        setRejectedFiles([])
      }

      setOpen(nextOpen)
    },
    [reset],
  )

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="flex max-h-[calc(100vh-2rem)] flex-col overflow-hidden sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Upload Documents</DialogTitle>
          <DialogDescription>
            Select Gemini File Search supported files up to{' '}
            {formatBytes(geminiFileSearchUploadPolicy.maxFileSizeBytes)} each.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
          <div
            {...getRootProps({
              className: cn(
                'flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 transition-colors',
                isDragReject
                  ? 'border-destructive bg-destructive/5'
                  : isDragActive
                    ? 'border-primary bg-primary/5'
                    : 'border-muted-foreground/25',
                isUploading && 'pointer-events-none opacity-50',
              ),
            })}
          >
            <input {...getInputProps()} />
            <div className="rounded-full bg-muted p-3">
              <Upload className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">Drag & drop files here</p>
              <p className="text-xs text-muted-foreground">
                or click below to browse
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={openFileDialog}
              disabled={isUploading}
            >
              Browse Files
            </Button>
          </div>

          {rejectedFiles.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {rejectedFiles.map((file, index) => (
                  <p key={`${file.file.name}-${file.code}-${index}`}>
                    {file.file.name}: {file.message}
                  </p>
                ))}
              </AlertDescription>
            </Alert>
          )}

          {fileItems.length > 0 && (
            <div className="flex flex-col gap-2">
              {fileItems.map((item) => (
                <UploadQueueItemRow
                  key={item.id}
                  item={item}
                  disabled={isUploading}
                  onBaseNameChange={updateBaseName}
                  onRemove={removeFile}
                />
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isUploading}
          >
            {allDone ? 'Close' : 'Cancel'}
          </Button>
          {!allDone && (
            <Button onClick={uploadAll} disabled={uploadableCount === 0 || isUploading}>
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Upload{uploadableCount > 0 ? ` (${uploadableCount})` : ''}
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
