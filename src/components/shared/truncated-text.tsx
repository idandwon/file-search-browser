import { useRef, useState, useEffect, useCallback } from 'react'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

type TruncatedTextProps = {
  readonly children: string
  readonly className?: string
  readonly tooltipContentClassName?: string
  readonly truncate?: boolean
}

export const TruncatedText = ({
  children,
  className,
  tooltipContentClassName,
  truncate = true,
}: TruncatedTextProps) => {
  const ref = useRef<HTMLSpanElement>(null)
  const [isOverflowing, setIsOverflowing] = useState(false)

  const checkOverflow = useCallback(() => {
    const element = ref.current
    if (!element) return
    setIsOverflowing(
      element.scrollWidth > element.clientWidth || element.scrollHeight > element.clientHeight,
    )
  }, [])

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const frameId = requestAnimationFrame(checkOverflow)
    const observer = new ResizeObserver(checkOverflow)
    observer.observe(element)

    return () => {
      cancelAnimationFrame(frameId)
      observer.disconnect()
    }
  }, [children, checkOverflow])

  return (
    <Tooltip open={isOverflowing ? undefined : false}>
      <TooltipTrigger asChild>
        <span ref={ref} className={cn('block', truncate && 'truncate', className)}>
          {children}
        </span>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        className={cn('max-w-sm break-all', tooltipContentClassName)}
      >
        {children}
      </TooltipContent>
    </Tooltip>
  )
}
