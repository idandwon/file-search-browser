import { MessageSquareText, Settings2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { StoreQueryClearConversationAction } from './store-query-clear-conversation-action'

const StoreQueryPanelTitle = () => (
  <div className="flex min-w-0 items-center gap-3">
    <div className="flex size-8 shrink-0 items-center justify-center rounded-md border bg-muted">
      <MessageSquareText className="h-4 w-4 text-muted-foreground" />
    </div>
    <div className="min-w-0 space-y-1">
      <CardTitle className="text-sm">Ask this store</CardTitle>
      <CardDescription className="text-xs leading-5">
        Follow-up questions use this dialog conversation. Closing clears it.
      </CardDescription>
    </div>
  </div>
)

type StoreQueryPanelHeaderProps = {
  readonly clearConversation: () => void
  readonly hasActivity: boolean
  readonly onOpenSettings: () => void
  readonly onRequestClose: () => void
}

const StoreQueryPanelActions = ({
  clearConversation,
  hasActivity,
  onOpenSettings,
  onRequestClose,
}: StoreQueryPanelHeaderProps) => (
  <TooltipProvider>
    <div className="flex items-center gap-2">
      <StoreQueryClearConversationAction
        clearConversation={clearConversation}
        hasActivity={hasActivity}
      />
      <Tooltip>
        <TooltipTrigger asChild>
          <Button size="icon-sm" variant="outline" onClick={onOpenSettings}>
            <Settings2 className="h-4 w-4" />
            <span className="sr-only">Open prompt settings</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent sideOffset={8}>Prompt settings</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button size="icon-sm" variant="ghost" onClick={onRequestClose}>
            <X className="h-4 w-4" />
            <span className="sr-only">Close query dialog</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent sideOffset={8}>Close</TooltipContent>
      </Tooltip>
    </div>
  </TooltipProvider>
)

export const StoreQueryPanelHeader = ({
  clearConversation,
  hasActivity,
  onOpenSettings,
  onRequestClose,
}: StoreQueryPanelHeaderProps) => (
  <CardHeader className="px-4 py-4 md:px-6">
    <StoreQueryPanelTitle />
    <CardAction className="self-center">
      <StoreQueryPanelActions
        clearConversation={clearConversation}
        hasActivity={hasActivity}
        onOpenSettings={onOpenSettings}
        onRequestClose={onRequestClose}
      />
    </CardAction>
  </CardHeader>
)
