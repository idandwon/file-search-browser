import { useState, useCallback } from 'react'
import { ConfirmationDialog } from '@/components/shared/confirmation-dialog'
import { useDeleteDocument } from '@/hooks/documents/use-delete-document'
import {
  getDocumentDisplayName,
  getDocumentId,
} from '@/lib/documents/presentation'
import type { Document } from '@/lib/api/types'

type DeleteDocumentDialogProps = {
  readonly document: Document
  readonly storeId: string
  readonly trigger: React.ReactNode
  readonly onDeleted?: () => void
}

export const DeleteDocumentDialog = ({
  document,
  storeId,
  trigger,
  onDeleted,
}: DeleteDocumentDialogProps) => {
  const [open, setOpen] = useState(false)
  const { mutate, isPending, error, reset } = useDeleteDocument(storeId)

  const displayName = getDocumentDisplayName(document)
  const documentId = getDocumentId(document)
  const filename = (
    <span className="font-semibold [overflow-wrap:anywhere]">
      {displayName}
    </span>
  )

  const handleConfirm = useCallback(() => {
    mutate(documentId, {
      onSuccess: () => {
        setOpen(false)
        onDeleted?.()
      },
    })
  }, [mutate, documentId, onDeleted])

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) reset()
      setOpen(nextOpen)
    },
    [reset],
  )

  return (
    <>
      <span onClickCapture={() => setOpen(true)}>{trigger}</span>
      <ConfirmationDialog
        open={open}
        onOpenChange={handleOpenChange}
        title="Delete Document"
        description={
          <>
            This action cannot be undone. This will permanently delete{' '}
            {filename} and all of its associated data.
          </>
        }
        confirmationLabel={
          <>
            I understand this permanently deletes {filename} and its associated
            data.
          </>
        }
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleConfirm}
        isPending={isPending}
        error={error}
      />
    </>
  )
}
