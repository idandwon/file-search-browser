import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

type EmptyStateProps = {
  readonly title: string
  readonly description?: string
  readonly icon?: LucideIcon
  readonly action?: ReactNode
}

export const EmptyState = ({
  title,
  description,
  icon: Icon,
  action,
}: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    {Icon && (
      <div className="mb-4 rounded-full bg-muted p-3">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
    )}
    <h3 className="text-lg font-medium text-foreground">{title}</h3>
    {description && (
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
    )}
    {action ? <div className="mt-4">{action}</div> : null}
  </div>
)
