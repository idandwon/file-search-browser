import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import { StoreQueryPanelHeader } from './store-query-panel-header'

export type StoreQueryPanelProps = {
  readonly children: ReactNode
  readonly clearConversation: () => void
  readonly className?: string
  readonly hasActivity: boolean
  readonly onOpenSettings: () => void
  readonly onRequestClose: () => void
}

export const StoreQueryPanel = ({
  children,
  className,
  clearConversation,
  hasActivity,
  onOpenSettings,
  onRequestClose,
}: StoreQueryPanelProps) => (
  <div className={cn('flex min-h-0 flex-1 flex-col bg-background', className)}>
    <StoreQueryPanelHeader
      clearConversation={clearConversation}
      hasActivity={hasActivity}
      onOpenSettings={onOpenSettings}
      onRequestClose={onRequestClose}
    />
    <Separator />
    {children}
  </div>
)
