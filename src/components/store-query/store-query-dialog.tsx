import { useCallback, useMemo, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { ConfirmationDialog } from '@/components/shared/confirmation-dialog'
import { useMediaQuery } from '@/hooks/use-media-query'
import {
  type StoreQuerySession,
  useStoreQuerySession,
} from '@/hooks/store-query/use-store-query-session'
import {
  getStoreQueryModelLabel,
  type StoreQueryModel,
} from '@/lib/store-query/config'
import { useStoreQueryDialogLifecycle } from '@/hooks/store-query/use-store-query-dialog-lifecycle'
import { StoreQueryDialogSession } from './store-query-dialog-session'

const getDialogClassName = (isDesktop: boolean) =>
  isDesktop
    ? 'flex h-[min(82dvh,52rem)] min-h-[min(38rem,calc(100dvh-2rem))] max-h-[calc(100dvh-2rem)] max-w-4xl flex-col overflow-hidden p-0 sm:max-w-4xl'
    : 'inset-0 flex h-dvh min-h-dvh max-w-none translate-x-0 translate-y-0 rounded-none border-0 p-0'

type StoreQueryDialogProps = {
  readonly storeId: string
}

type PendingConversationResetAction =
  | {
      readonly type: 'close'
    }
  | {
      readonly model: StoreQueryModel
      readonly type: 'model-change'
    }
  | {
      readonly prompt: string
      readonly type: 'prompt-change'
    }

const hasDraft = (session: StoreQuerySession): boolean =>
  session.composer.draft.trim().length > 0

const hasConversationToReset = (session: StoreQuerySession): boolean =>
  session.transcript.hasActivity

const shouldConfirmClose = (session: StoreQuerySession): boolean =>
  hasConversationToReset(session) || hasDraft(session)

const getResetActionCopy = (
  action: PendingConversationResetAction,
): {
  readonly confirmLabel: string
  readonly description: string
  readonly title: string
} => {
  switch (action.type) {
    case 'close':
      return {
        confirmLabel: 'Close and discard',
        description:
          'Closing this dialog will discard the current conversation and draft. Your prompt settings and selected model will stay unchanged.',
        title: 'Close and discard this chat?',
      }
    case 'model-change':
      return {
        confirmLabel: `Use ${getStoreQueryModelLabel(action.model)}`,
        description: `Changing the model starts a new conversation. Your current conversation and draft will be cleared before switching to ${getStoreQueryModelLabel(action.model)}.`,
        title: 'Change model and start fresh?',
      }
    case 'prompt-change':
      return {
        confirmLabel: 'Save prompt and start fresh',
        description:
          'Saving these prompt instructions starts a new conversation. Your current conversation and draft will be cleared before the new prompt is applied.',
        title: 'Save prompt and clear this chat?',
      }
  }
}

export const StoreQueryDialog = ({ storeId }: StoreQueryDialogProps) => {
  const dialog = useStoreQueryDialogLifecycle()
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const session = useStoreQuerySession({
    isDialogOpen: dialog.isOpen,
    storeId,
  })
  const [pendingResetAction, setPendingResetAction] =
    useState<PendingConversationResetAction | null>(null)

  const requestClose = useCallback(() => {
    if (shouldConfirmClose(session)) {
      setPendingResetAction({ type: 'close' })
      return
    }

    dialog.requestClose()
  }, [dialog, session])

  const handleDialogOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (nextOpen) {
        dialog.open()
        return
      }

      requestClose()
    },
    [dialog, requestClose],
  )

  const handleModelChange = useCallback(
    (nextModel: StoreQueryModel) => {
      if (nextModel === session.composer.model) {
        return
      }

      if (hasConversationToReset(session)) {
        setPendingResetAction({
          model: nextModel,
          type: 'model-change',
        })
        return
      }

      session.composer.setModel(nextModel)
    },
    [session],
  )

  const handlePromptSave = useCallback(
    (nextPrompt: string): boolean => {
      if (nextPrompt === session.settings.prompt) {
        return true
      }

      if (hasConversationToReset(session)) {
        setPendingResetAction({
          prompt: nextPrompt,
          type: 'prompt-change',
        })
        return false
      }

      session.settings.setPrompt(nextPrompt)
      return true
    },
    [session],
  )

  const handleResetDialogOpenChange = useCallback((isOpen: boolean) => {
    if (!isOpen) {
      setPendingResetAction(null)
    }
  }, [])

  const handleResetConfirm = useCallback(() => {
    if (!pendingResetAction) {
      return
    }

    if (pendingResetAction.type === 'close') {
      setPendingResetAction(null)
      dialog.requestClose()
      return
    }

    session.transcript.clearConversation()

    if (pendingResetAction.type === 'model-change') {
      session.composer.setModel(pendingResetAction.model)
      setPendingResetAction(null)
      return
    }

    session.settings.setPrompt(pendingResetAction.prompt)
    session.settings.onOpenChange(false)
    setPendingResetAction(null)
  }, [dialog, pendingResetAction, session])

  const resetActionCopy = useMemo(
    () =>
      pendingResetAction ? getResetActionCopy(pendingResetAction) : null,
    [pendingResetAction],
  )

  return (
    <>
      <Dialog open={dialog.isOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent
          showCloseButton={false}
          className={getDialogClassName(isDesktop)}
          onInteractOutside={(event) => event.preventDefault()}
        >
          <DialogTitle className="sr-only">Ask this store</DialogTitle>
          <DialogDescription className="sr-only">
            Follow-up questions use the current dialog conversation and closing the
            dialog clears it.
          </DialogDescription>
          <StoreQueryDialogSession
            isDialogOpen={dialog.isOpen}
            onRequestClose={requestClose}
            session={{
              ...session,
              composer: {
                ...session.composer,
                setModel: handleModelChange,
              },
              settings: {
                ...session.settings,
                setPrompt: handlePromptSave,
              },
            }}
          />
        </DialogContent>
      </Dialog>
      {pendingResetAction && resetActionCopy ? (
        <ConfirmationDialog
          open
          onOpenChange={handleResetDialogOpenChange}
          title={resetActionCopy.title}
          description={resetActionCopy.description}
          confirmLabel={resetActionCopy.confirmLabel}
          requireAcknowledgement={false}
          variant={pendingResetAction.type === 'close' ? 'default' : 'destructive'}
          onConfirm={handleResetConfirm}
        />
      ) : null}
    </>
  )
}
