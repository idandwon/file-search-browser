import { AlertCircle, CheckCircle2, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { geminiFileSearchUploadDisplayNamePolicy } from '@/lib/documents/upload/gemini-file-search-upload-display-name-policy'
import {
  composeDisplayName,
  maxBaseNameLength,
} from '@/lib/documents/upload/upload-display-name'
import type { UploadQueueItem } from '@/hooks/documents/use-upload-queue'
import { cn } from '@/lib/utils'
import { formatBytes } from '@/lib/shared/format'

type UploadQueueItemRowProps = {
  readonly item: UploadQueueItem
  readonly disabled?: boolean
  readonly onBaseNameChange: (id: string, baseName: string) => void
  readonly onRemove: (id: string) => void
}

const statusIcon = (item: UploadQueueItem) => {
  if (item.validationError) {
    return <AlertCircle className="h-4 w-4 text-destructive" />
  }

  switch (item.status) {
    case 'uploading':
      return <Loader2 className="h-4 w-4 animate-spin text-primary" />
    case 'done':
      return <CheckCircle2 className="h-4 w-4 text-green-500" />
    case 'failed':
      return <AlertCircle className="h-4 w-4 text-destructive" />
    default:
      return null
  }
}

export const UploadQueueItemRow = ({
  item,
  disabled = false,
  onBaseNameChange,
  onRemove,
}: UploadQueueItemRowProps) => {
  const isEditable = !disabled && (item.status === 'queued' || item.status === 'failed')
  const displayName = composeDisplayName(
    {
      baseName: item.baseName,
      extension: item.extension,
    },
    geminiFileSearchUploadDisplayNamePolicy,
  )
  const allowedBaseNameLength = maxBaseNameLength(
    item.extension,
    geminiFileSearchUploadDisplayNamePolicy,
  )

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-md border px-3 py-3 text-sm',
        (item.validationError || item.uploadError) && 'border-destructive/60',
      )}
    >
      <div className="flex h-9 items-center">{statusIcon(item)}</div>

      <div className="min-w-0 flex-1 space-y-2">
        {isEditable ? (
          <div className="flex items-center gap-2">
            <Input
              value={item.baseName}
              onChange={(event) =>
                onBaseNameChange(item.id, event.target.value)
              }
              maxLength={allowedBaseNameLength}
              aria-label={`Rename ${item.file.name}`}
              aria-invalid={!!item.validationError}
              placeholder="Enter a file name"
            />
            {item.extension && (
              <span className="shrink-0 rounded-md border border-border bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                {item.extension}
              </span>
            )}
          </div>
        ) : (
          <p className="truncate font-medium">{displayName}</p>
        )}

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="truncate">{item.file.name}</span>
          <span aria-hidden>·</span>
          <span className="shrink-0">{formatBytes(item.file.size)}</span>
        </div>

        {item.validationError && (
          <p className="text-xs text-destructive">{item.validationError}</p>
        )}
        {!item.validationError && item.uploadError && (
          <p className="text-xs text-destructive">{item.uploadError}</p>
        )}
      </div>

      {(item.status === 'queued' || item.status === 'failed') && (
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => onRemove(item.id)}
          disabled={disabled}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  )
}
