import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { StoreQueryMessage } from '@/lib/store-query/types'
import { cn } from '@/lib/utils'
import { AlertCircle, Loader2 } from 'lucide-react'

import { StoreQueryResult } from './store-query-result'

type StoreQueryTranscriptMessageProps = {
  readonly message: StoreQueryMessage
  readonly onRetry: (question: string) => void
}

const userMessageShellClassName = 'min-w-0 w-fit max-w-xl'
const assistantMessageShellClassName = 'min-w-0 w-full max-w-xl'


const getMessageRowClassName = (role: StoreQueryMessage['role']) =>
  cn('flex w-full', role === 'user' ? 'justify-end' : 'justify-start')

const StoreQueryUserMessage = ({
  message,
}: Pick<StoreQueryTranscriptMessageProps, 'message'>) => (
  <Card className={cn(userMessageShellClassName, 'gap-0 py-0')}>
    <CardContent className="px-4 py-3">
      <p className="text-right text-sm leading-6 [overflow-wrap:anywhere]">
        {message.content}
      </p>
    </CardContent>
  </Card>
)

const StoreQueryAssistantPendingMessage = () => (
  <Alert className={assistantMessageShellClassName}>
    <Loader2 className="animate-spin" />
    <AlertTitle>Searching the store...</AlertTitle>
  </Alert>
)

const StoreQueryAssistantErrorMessage = ({
  message,
  onRetry,
}: StoreQueryTranscriptMessageProps) => (
  <Alert variant="destructive" className={assistantMessageShellClassName}>
    <AlertCircle />
    <AlertTitle>Query failed</AlertTitle>
    <AlertDescription className="space-y-3">
      <p>{message.error ?? 'Query failed.'}</p>
      <Button
        size="sm"
        variant="outline"
        onClick={() => onRetry(message.question)}
      >
        Retry
      </Button>
    </AlertDescription>
  </Alert>
)

const StoreQueryAssistantCompleteMessage = ({
  message,
}: Pick<StoreQueryTranscriptMessageProps, 'message'>) => {
  const hasSources = message.sources.length > 0

  return (
    <Card className={cn(assistantMessageShellClassName, 'gap-0 py-0')}>
      <CardContent
        className={cn('min-w-0 px-4 pt-4', hasSources ? 'pb-3' : 'pb-4')}
      >
        <StoreQueryResult content={message.content} sources={message.sources} />
      </CardContent>
    </Card>
  )
}

const StoreQueryAssistantMessage = (props: StoreQueryTranscriptMessageProps) => {
  if (props.message.status === 'pending') {
    return <StoreQueryAssistantPendingMessage />
  }

  if (props.message.status === 'error') {
    return <StoreQueryAssistantErrorMessage {...props} />
  }

  return <StoreQueryAssistantCompleteMessage message={props.message} />
}

export const StoreQueryTranscriptMessage = (
  props: StoreQueryTranscriptMessageProps,
) => (
  <div
    data-store-query-message=""
    data-message-role={props.message.role}
    data-message-status={props.message.status}
    className={getMessageRowClassName(props.message.role)}
  >
    {props.message.role === 'user' ? (
      <StoreQueryUserMessage message={props.message} />
    ) : (
      <StoreQueryAssistantMessage {...props} />
    )}
  </div>
)
