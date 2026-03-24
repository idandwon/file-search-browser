import { useState } from 'react'
import MDEditor from '@uiw/react-md-editor/nohighlight'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { STORE_QUERY_DEFAULT_PROMPT } from '@/lib/store-query/config'
import { storeQueryMarkdownPreviewOptions } from './store-query-markdown-preview-options'

type StoreQuerySettingsDialogProps = {
  readonly currentPrompt: string
  readonly isOpen: boolean
  readonly onOpenChange: (isOpen: boolean) => void
  readonly onPromptSave: (prompt: string) => boolean
}

const getDialogKey = ({
  currentPrompt,
}: Pick<StoreQuerySettingsDialogProps, 'currentPrompt'>): string => currentPrompt

export const StoreQuerySettingsDialog = ({
  currentPrompt,
  isOpen,
  onOpenChange,
  onPromptSave,
}: StoreQuerySettingsDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      {isOpen ? (
        <StoreQuerySettingsDialogBody
          key={getDialogKey({ currentPrompt })}
          currentPrompt={currentPrompt}
          onOpenChange={onOpenChange}
          onPromptSave={onPromptSave}
        />
      ) : null}
    </Dialog>
  )
}

type StoreQuerySettingsDialogBodyProps = Omit<StoreQuerySettingsDialogProps, 'isOpen'>

const StoreQuerySettingsDialogBody = ({
  currentPrompt,
  onOpenChange,
  onPromptSave,
}: StoreQuerySettingsDialogBodyProps) => {
  const [draftPrompt, setDraftPrompt] = useState(currentPrompt)

  return (
    <DialogContent className="flex max-h-screen flex-col overflow-hidden sm:max-w-4xl">
      <DialogHeader>
        <DialogTitle>Prompt settings</DialogTitle>
        <DialogDescription>
          Save markdown instructions for this store. The model picker lives in the
          composer. If this chat is already active, saving a new prompt starts a
          fresh conversation.
        </DialogDescription>
      </DialogHeader>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1">
            <h3 className="text-sm font-medium">Prompt</h3>
            <p className="text-xs text-muted-foreground">
              The question field stays separate from these saved instructions.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setDraftPrompt(STORE_QUERY_DEFAULT_PROMPT)}
            disabled={draftPrompt === STORE_QUERY_DEFAULT_PROMPT}
          >
            Use default prompt
          </Button>
        </div>
        <MDEditor
          value={draftPrompt}
          onChange={(value) => setDraftPrompt(value ?? '')}
          preview="live"
          height={360}
          data-color-mode="light"
          previewOptions={storeQueryMarkdownPreviewOptions}
        />
      </div>
      <DialogFooter className="justify-end">
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button
          type="button"
          onClick={() => {
            if (onPromptSave(draftPrompt)) {
              onOpenChange(false)
            }
          }}
          disabled={!draftPrompt.trim()}
        >
          Save
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}
