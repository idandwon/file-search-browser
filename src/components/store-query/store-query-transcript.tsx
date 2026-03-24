import { useLayoutEffect, useRef } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useMediaQuery } from '@/hooks/use-media-query'
import type { StoreQueryAvailability } from '@/lib/store-query/availability'
import type { StoreQueryMessage as StoreQueryMessageType } from '@/lib/store-query/types'
import { cn } from '@/lib/utils'
import { StoreQueryAvailabilityState } from './store-query-availability-state'
import { StoreQueryTranscriptMessage } from './store-query-exchange'
import { StoreQueryPanelEmptyState } from './store-query-panel-empty-state'

const getTranscriptScrollTrigger = (
  messages: readonly StoreQueryMessageType[],
): string => {
  const lastMessage = messages[messages.length - 1]

  if (!lastMessage) {
    return 'empty'
  }

  return `${messages.length}:${lastMessage.id}:${lastMessage.status}`
}

const useTranscriptAutoScroll = (
  messages: readonly StoreQueryMessageType[],
) => {
  const viewportRef = useRef<HTMLDivElement>(null)
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const scrollTrigger = getTranscriptScrollTrigger(messages)

  useLayoutEffect(() => {
    const viewport = viewportRef.current

    if (!viewport || scrollTrigger === 'empty') {
      return
    }

    viewport.scrollTo({
      top: viewport.scrollHeight,
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    })
  }, [prefersReducedMotion, scrollTrigger])

  return viewportRef
}

type StoreQueryTranscriptStateProps = {
  readonly availability: StoreQueryAvailability
}

const StoreQueryTranscriptState = ({
  availability,
}: StoreQueryTranscriptStateProps) => {
  if (availability.canQuery) {
    return <StoreQueryPanelEmptyState />
  }

  return (
    <StoreQueryAvailabilityState
      title={availability.title}
      description={availability.description}
      isProcessing={availability.isProcessing}
    />
  )
}

const getTranscriptClassName = (isEmpty: boolean) =>
  cn(
    'mx-auto flex min-h-full w-full max-w-3xl flex-col px-4 py-5 md:px-6 md:py-6',
    isEmpty ? 'justify-center gap-6' : 'gap-4',
  )

const StoreQueryTranscriptMessages = ({
  availability,
  messages,
  retryMessage,
}: {
  readonly availability: StoreQueryAvailability
  readonly messages: readonly StoreQueryMessageType[]
  readonly retryMessage: (question: string) => void
}) => {
  return (
    <>
      {messages.map((message) => (
        <StoreQueryTranscriptMessage
          key={message.id}
          message={message}
          onRetry={retryMessage}
        />
      ))}
      {availability.canQuery ? null : (
        <StoreQueryAvailabilityState
          title={availability.title}
          description={availability.description}
          isProcessing={availability.isProcessing}
        />
      )}
    </>
  )
}

export type StoreQueryTranscriptProps = {
  readonly availability: StoreQueryAvailability
  readonly messages: readonly StoreQueryMessageType[]
  readonly retryMessage: (question: string) => void
}

export const StoreQueryTranscript = ({
  availability,
  messages,
  retryMessage,
}: StoreQueryTranscriptProps) => {
  const viewportRef = useTranscriptAutoScroll(messages)
  const isEmpty = messages.length === 0

  return (
    <ScrollArea className="h-full" viewportRef={viewportRef}>
      <div className={getTranscriptClassName(isEmpty)}>
        {isEmpty ? (
          <StoreQueryTranscriptState availability={availability} />
        ) : (
          <StoreQueryTranscriptMessages
            availability={availability}
            messages={messages}
            retryMessage={retryMessage}
          />
        )}
      </div>
    </ScrollArea>
  )
}
