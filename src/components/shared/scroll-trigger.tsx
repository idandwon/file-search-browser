import type { ReactNode } from 'react'
import { useOnInView } from 'react-intersection-observer'
import { LoadingSpinner } from '@/components/shared/loading-spinner'

type ScrollTriggerProps = {
  readonly enabled: boolean
  readonly isFetching: boolean
  readonly onAutoLoadMore?: () => void
  readonly footer?: ReactNode
}

export const ScrollTrigger = ({
  enabled,
  isFetching,
  onAutoLoadMore,
  footer,
}: ScrollTriggerProps) => {
  const shouldRender = enabled || isFetching || footer !== undefined
  const canObserve =
    enabled &&
    onAutoLoadMore !== undefined &&
    typeof IntersectionObserver !== 'undefined'
  const triggerRef = useOnInView(
    (inView) => {
      if (!inView || !enabled || isFetching || !onAutoLoadMore) {
        return
      }

      onAutoLoadMore()
    },
    {
      threshold: 0.1,
      skip: !canObserve,
    },
  )

  if (!shouldRender) {
    return null
  }

  return (
    <div className="flex min-h-10 flex-col items-center justify-center gap-3 py-4">
      {enabled ? <div ref={triggerRef} className="h-px w-full" /> : null}
      {isFetching ? <LoadingSpinner /> : null}
      {footer}
    </div>
  )
}
