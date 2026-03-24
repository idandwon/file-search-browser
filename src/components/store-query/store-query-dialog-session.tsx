import { CardContent, CardFooter } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ErrorDisplay } from '@/components/shared/error-display'
import type { StoreQuerySession } from '@/hooks/store-query/use-store-query-session'
import { StoreQuerySettingsDialog } from './store-query-settings-dialog'
import { StoreQueryPanel } from './store-query-panel'
import { StoreQueryPanelLoadingState } from './store-query-panel-loading-state'
import { StoreQueryTranscript } from './store-query-transcript'
import { StoreQueryForm } from './store-query-form'

type StoreQueryDialogSessionProps = {
  readonly isDialogOpen: boolean
  readonly onRequestClose: () => void
  readonly session: Omit<StoreQuerySession, 'settings'> & {
    readonly settings: Omit<StoreQuerySession['settings'], 'setPrompt'> & {
      readonly setPrompt: (prompt: string) => boolean
    }
  }
}

export const StoreQueryDialogSession = ({
  isDialogOpen,
  onRequestClose,
  session,
}: StoreQueryDialogSessionProps) => {
  return (
    <>
      <StoreQueryPanel
        clearConversation={session.transcript.clearConversation}
        hasActivity={session.transcript.hasActivity}
        onOpenSettings={session.settings.open}
        onRequestClose={onRequestClose}
      >
        {session.store.isLoading ? (
          <StoreQueryPanelLoadingState />
        ) : session.store.error ? (
          <CardContent className="flex min-h-0 flex-1 items-center justify-center px-4 py-6 md:px-6">
            <ErrorDisplay error={session.store.error} onRetry={session.store.retry} />
          </CardContent>
        ) : (
          <>
            <CardContent className="min-h-0 flex-1 px-0">
              <StoreQueryTranscript
                availability={session.store.availability}
                messages={session.transcript.messages}
                retryMessage={session.transcript.retryMessage}
              />
            </CardContent>
            <Separator />
            <CardFooter className="shrink-0 items-stretch px-4 py-4 md:px-6">
              <StoreQueryForm
                canQuery={session.store.availability.canQuery}
                canSubmit={session.composer.canSubmit}
                draft={session.composer.draft}
                isPending={session.composer.isPending}
                isOpen={isDialogOpen}
                model={session.composer.model}
                onModelChange={session.composer.setModel}
                onSubmit={session.composer.submit}
                setDraft={session.composer.setDraft}
              />
            </CardFooter>
          </>
        )}
      </StoreQueryPanel>
      <StoreQuerySettingsDialog
        currentPrompt={session.settings.prompt}
        isOpen={session.settings.isOpen}
        onOpenChange={session.settings.onOpenChange}
        onPromptSave={session.settings.setPrompt}
      />
    </>
  )
}
