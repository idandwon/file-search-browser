import { useCallback, useState } from 'react'
import { ConfirmationDialog } from '@/components/shared/confirmation-dialog'
import {
  useDeleteDocuments,
  type DeleteDocumentsResult,
} from '@/hooks/documents/use-delete-documents'
import {
  getDocumentDisplayName,
  getDocumentId,
} from '@/lib/documents/presentation'
import type { Document } from '@/lib/api/types'

const MAX_PREVIEW_DOCUMENTS = 3

type BulkDeleteDocumentsDialogProps = {
  readonly documents: readonly Document[]
  readonly storeId: string
  readonly trigger: React.ReactNode
  readonly disabled?: boolean
  readonly onCompleted?: (result: DeleteDocumentsResult) => void
}

const getPreviewDocuments = (documents: readonly Document[]) =>
  documents.slice(0, MAX_PREVIEW_DOCUMENTS).map((document) => ({
    id: getDocumentId(document),
    displayName: getDocumentDisplayName(document),
  }))

export const BulkDeleteDocumentsDialog = ({
  documents,
  storeId,
  trigger,
  disabled = false,
  onCompleted,
}: BulkDeleteDocumentsDialogProps) => {
  const [open, setOpen] = useState(false)
  const { mutate, isPending, error, reset } = useDeleteDocuments(storeId)

  const documentCount = documents.length
  const previewDocuments = getPreviewDocuments(documents)
  const hiddenCount = Math.max(0, documentCount - previewDocuments.length)
  const documentLabel = documentCount === 1 ? 'document' : 'documents'

  const handleConfirm = useCallback(() => {
    if (disabled || documentCount === 0) return

    mutate(
      documents.map((document) => getDocumentId(document)),
      {
        onSuccess: (result) => {
          setOpen(false)
          onCompleted?.(result)
        },
      },
    )
  }, [disabled, documentCount, documents, mutate, onCompleted])

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) reset()
      setOpen(nextOpen)
    },
    [reset],
  )

  return (
    <>
      <span
        onClickCapture={() => {
          if (disabled) return
          setOpen(true)
        }}
      >
        {trigger}
      </span>
      <ConfirmationDialog
        open={open}
        onOpenChange={handleOpenChange}
        title="Delete selected documents"
        description={
          <div className="space-y-3 text-left">
            <p>
              This action cannot be undone. This will permanently delete{' '}
              <span className="font-semibold">{documentCount}</span> selected{' '}
              {documentLabel} and all associated data.
            </p>
            <ul className="space-y-1 text-sm text-foreground">
              {previewDocuments.map((document) => (
                <li key={document.id} className="[overflow-wrap:anywhere]">
                  {document.displayName}
                </li>
              ))}
              {hiddenCount > 0 ? (
                <li className="text-muted-foreground">+{hiddenCount} more</li>
              ) : null}
            </ul>
          </div>
        }
        confirmationLabel={
          <>
            I understand this permanently deletes the selected {documentLabel}{' '}
            and all associated data.
          </>
        }
        confirmLabel="Delete selected"
        variant="destructive"
        onConfirm={handleConfirm}
        isPending={isPending}
        error={error}
      />
    </>
  )
}
