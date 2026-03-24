import { Separator } from '@/components/ui/separator'
import type { StoreQuerySource } from '@/lib/store-query/types'
import { StoreQueryMarkdown } from './store-query-markdown'
import { StoreQuerySources } from './store-query-sources'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Check, AlertCircle, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { useEffect } from 'react'

const copyFeedbackResetDelay = 2_000

type CopyFeedbackState = 'copied' | 'error' | 'idle'

const getCopyTooltipText = (feedbackState: CopyFeedbackState) => {
  if (feedbackState === 'copied') {
    return 'Copied'
  }

  if (feedbackState === 'error') {
    return 'Copy failed'
  }

  return 'Copy'
}

const StoreQueryAssistantCopyAction = ({
  content,
}: {
  readonly content: string
}) => {
  const [feedbackState, setFeedbackState] = useState<CopyFeedbackState>('idle')

  useEffect(() => {
    if (feedbackState === 'idle') {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setFeedbackState('idle')
    }, copyFeedbackResetDelay)

    return () => window.clearTimeout(timeoutId)
  }, [feedbackState])

  const handleCopy = async () => {
    try {
      if (!navigator.clipboard) {
        throw new Error('Clipboard API unavailable')
      }

      await navigator.clipboard.writeText(content)
      setFeedbackState('copied')
    } catch {
      setFeedbackState('error')
    }
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          size="icon-xs"
          variant="ghost"
          aria-label="Copy answer"
          onClick={() => void handleCopy()}
        >
          {feedbackState === 'copied' ? (
            <Check className="h-3.5 w-3.5" />
          ) : feedbackState === 'error' ? (
            <AlertCircle className="h-3.5 w-3.5" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
          <span className="sr-only">Copy answer</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent sideOffset={8}>
        {getCopyTooltipText(feedbackState)}
      </TooltipContent>
    </Tooltip>
  )
}


type StoreQueryResultProps = {
  readonly content: string
  readonly sources: readonly StoreQuerySource[]
}

export const StoreQueryResult = ({
  content,
  sources,
}: StoreQueryResultProps) => (
  <div className="space-y-2">
    <StoreQueryMarkdown source={content} className="text-sm leading-6" />
    <div className="flex justify-end">
      <StoreQueryAssistantCopyAction content={content} />
    </div>
    {sources.length > 0 ? <Separator /> : null}
    <StoreQuerySources sources={sources} />
  </div>
)
