import { useCallback } from 'react'
import { Trash2 } from 'lucide-react'
import { ConfirmationDialog } from '@/components/shared/confirmation-dialog'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useDisclosure } from '@/hooks/use-disclosure'

const CLEAR_DESCRIPTION =
  'This will remove the current conversation and draft question from this modal. Your prompt settings and selected model will stay unchanged.'

const StoreQueryClearConversationTrigger = ({
  onOpen,
}: {
  readonly onOpen: () => void
}) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button size="icon-sm" variant="outline" onClick={onOpen}>
        <Trash2 className="h-4 w-4" />
        <span className="sr-only">Clear conversation</span>
      </Button>
    </TooltipTrigger>
    <TooltipContent sideOffset={8}>Clear conversation</TooltipContent>
  </Tooltip>
)

const StoreQueryClearConversationDialog = ({
  isOpen,
  onConfirm,
  onOpenChange,
}: {
  readonly isOpen: boolean
  readonly onConfirm: () => void
  readonly onOpenChange: (isOpen: boolean) => void
}) => (
  <ConfirmationDialog
    open={isOpen}
    onOpenChange={onOpenChange}
    title="Clear conversation?"
    description={CLEAR_DESCRIPTION}
    confirmLabel="Clear conversation"
    requireAcknowledgement={false}
    variant="destructive"
    onConfirm={onConfirm}
  />
)

const useHandleConfirm = ({
  clearConversation,
  closeDialog,
}: {
  readonly clearConversation: () => void
  readonly closeDialog: () => void
}) =>
  useCallback(() => {
    closeDialog()
    clearConversation()
  }, [clearConversation, closeDialog])

export const StoreQueryClearConversationAction = ({
  clearConversation,
  hasActivity,
}: {
  readonly clearConversation: () => void
  readonly hasActivity: boolean
}) => {
  const dialog = useDisclosure()
  const handleConfirm = useHandleConfirm({
    clearConversation,
    closeDialog: dialog.close,
  })

  if (!hasActivity) return null

  return (
    <>
      <StoreQueryClearConversationTrigger onOpen={dialog.open} />
      <StoreQueryClearConversationDialog
        isOpen={dialog.isOpen}
        onConfirm={handleConfirm}
        onOpenChange={dialog.onOpenChange}
      />
    </>
  )
}
