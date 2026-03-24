import { useState, useCallback, useId, type ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type ConfirmationDialogProps = {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly title: string
  readonly description: ReactNode
  readonly confirmationLabel?: ReactNode
  readonly confirmLabel?: string
  readonly requireAcknowledgement?: boolean
  readonly variant?: 'default' | 'destructive'
  readonly onConfirm: () => void
  readonly isPending?: boolean
  readonly error?: Error | null
}

const canConfirm = ({
  isConfirmed,
  isPending,
  requireAcknowledgement,
}: {
  readonly isConfirmed: boolean
  readonly isPending: boolean
  readonly requireAcknowledgement: boolean
}) => {
  if (isPending) return false
  if (!requireAcknowledgement) return true
  return isConfirmed
}

const ConfirmationDialogAcknowledgement = ({
  confirmationId,
  confirmationLabel,
  isConfirmed,
  isPending,
  onConfirmedChange,
  requireAcknowledgement,
}: {
  readonly confirmationId: string
  readonly confirmationLabel: ReactNode
  readonly isConfirmed: boolean
  readonly isPending: boolean
  readonly onConfirmedChange: (checked: boolean) => void
  readonly requireAcknowledgement: boolean
}) => {
  if (!requireAcknowledgement) return null

  return (
    <label
      htmlFor={confirmationId}
      className="flex w-full min-w-0 items-start gap-3 rounded-md border border-border bg-muted/30 p-3 text-sm"
    >
      <Checkbox
        id={confirmationId}
        className="mt-0.5 shrink-0"
        checked={isConfirmed}
        onCheckedChange={(checked) => onConfirmedChange(checked === true)}
        disabled={isPending}
      />
      <span className="min-w-0 flex-1 leading-5 text-foreground [overflow-wrap:anywhere]">
        {confirmationLabel}
      </span>
    </label>
  )
}

export const ConfirmationDialog = ({
  open,
  onOpenChange,
  title,
  description,
  confirmationLabel = 'I understand this action cannot be undone.',
  confirmLabel = 'Confirm',
  requireAcknowledgement = true,
  variant = 'destructive',
  onConfirm,
  isPending = false,
  error = null,
}: ConfirmationDialogProps) => {
  const [isConfirmed, setIsConfirmed] = useState(false)
  const confirmationId = useId()

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) setIsConfirmed(false)
      onOpenChange(nextOpen)
    },
    [onOpenChange],
  )

  const isConfirmEnabled = canConfirm({
    isConfirmed,
    isPending,
    requireAcknowledgement,
  })

  const handleConfirm = useCallback(() => {
    if (!isConfirmEnabled) return
    onConfirm()
  }, [isConfirmEnabled, onConfirm])

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        onEscapeKeyDown={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <ConfirmationDialogAcknowledgement
            confirmationId={confirmationId}
            confirmationLabel={confirmationLabel}
            isConfirmed={isConfirmed}
            isPending={isPending}
            onConfirmedChange={setIsConfirmed}
            requireAcknowledgement={requireAcknowledgement}
          />
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={isPending}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            variant={variant}
            onClick={handleConfirm}
            disabled={!isConfirmEnabled}
          >
            {isPending ? 'Processing...' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
