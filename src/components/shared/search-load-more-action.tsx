import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { Button } from '@/components/ui/button'

type SearchLoadMoreActionProps = {
  readonly isLoading: boolean
  readonly canLoadMore: boolean
  readonly onLoadMore: () => void
  readonly buttonLabel?: string
  readonly loadingLabel?: string
}

export const SearchLoadMoreAction = ({
  isLoading,
  canLoadMore,
  onLoadMore,
  buttonLabel = 'Load more',
  loadingLabel = 'Loading more results',
}: SearchLoadMoreActionProps) => {
  if (isLoading) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex min-h-8 items-center justify-center gap-2 text-sm text-muted-foreground"
      >
        <LoadingSpinner label={loadingLabel} />
      </div>
    )
  }

  if (!canLoadMore) {
    return null
  }

  return (
    <div className="flex items-center justify-center">
      <Button type="button" variant="outline" size="sm" onClick={onLoadMore}>
        {buttonLabel}
      </Button>
    </div>
  )
}
