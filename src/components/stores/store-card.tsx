import type { MouseEvent } from 'react'
import { Link } from '@tanstack/react-router'
import { Database, ChevronRight, Calendar, Star } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { extractId } from '@/lib/api/file-search-resource'
import type { FileSearchStore } from '@/lib/api/types'
import { formatDate } from '@/lib/shared/format'

type StoreCardProps = {
  readonly store: FileSearchStore
  readonly isFavorite: boolean
  readonly onToggleFavorite: (storeId: string) => void
}

export const StoreCard = ({ store, isFavorite, onToggleFavorite }: StoreCardProps) => {
  const storeId = extractId(store.name)

  const handleToggleFavorite = (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onToggleFavorite(storeId)
  }

  return (
    <Link className="group/card block" to="/stores/$storeId" params={{ storeId }}>
      <Card className="flex-row items-center gap-4 px-6 py-6">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
          <Database className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          <p className="truncate text-sm font-semibold leading-none">
            {store.displayName || storeId}
          </p>
          <p className="truncate font-mono text-xs text-muted-foreground">
            {storeId}
          </p>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3 shrink-0" />
            <span>Created {formatDate(store.createTime)}</span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 shrink-0 p-0"
          onClick={handleToggleFavorite}
        >
          <Star
            className={`h-4 w-4 ${isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
          />
        </Button>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover/card:translate-x-0.5" />
      </Card>
    </Link>
  )
}
