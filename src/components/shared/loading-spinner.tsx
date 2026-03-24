import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type LoadingSpinnerProps = {
  readonly label?: string
  readonly className?: string
}

export const LoadingSpinner = ({
  label = 'Loading',
  className,
}: LoadingSpinnerProps) => (
  <div role="status" aria-live="polite" className="flex items-center justify-center">
    <Loader2 className={cn('h-4 w-4 animate-spin text-muted-foreground', className)} />
    <span className="sr-only">{label}</span>
  </div>
)
