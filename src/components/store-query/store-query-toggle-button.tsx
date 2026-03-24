import { MessageSquareText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useStoreQueryDialogLifecycle } from '@/hooks/store-query/use-store-query-dialog-lifecycle'

type StoreQueryToggleButtonProps = {
  readonly className?: string
}

export const StoreQueryToggleButton = ({ className }: StoreQueryToggleButtonProps) => {
  const dialog = useStoreQueryDialogLifecycle()

  return (
    <Button
      variant="outline"
      onClick={dialog.open}
      aria-pressed={dialog.isOpen}
      className={className}
    >
      <MessageSquareText className="h-4 w-4" />
      Ask
    </Button>
  )
}
