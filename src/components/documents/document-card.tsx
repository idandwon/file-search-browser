import { Link } from '@tanstack/react-router'
import { FileText, HardDrive, FileType, Calendar, ChevronRight, Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { DeleteDocumentDialog } from './delete-document-dialog'
import type { Document } from '@/lib/api/types'
import {
  getDocumentDisplayName,
  getDocumentId,
  stateVariant,
} from '@/lib/documents/presentation'
import type { ListSearch } from '@/lib/shared/search/list-search'
import { cn } from '@/lib/utils'
import { formatBytes, formatDate } from '@/lib/shared/format'

type DocumentCardProps = {
  readonly document: Document
  readonly storeId: string
  readonly search: ListSearch
  readonly hasActiveSelection?: boolean
  readonly isSelected?: boolean
  readonly onSelectedChange?: (checked: boolean) => void
}

type MetaItemProps = {
  readonly icon: React.ComponentType<{ className?: string }>
  readonly children: React.ReactNode
}

const MetaItem = ({ icon: Icon, children }: MetaItemProps) => (
  <span className="inline-flex items-center gap-1">
    <Icon className="h-3 w-3 shrink-0" />
    {children}
  </span>
)

const MetaDot = () => (
  <span className="text-border" aria-hidden>
    ·
  </span>
)

type DocumentCardMainContentProps = {
  readonly document: Document
  readonly documentId: string
  readonly displayName: string
}

const DocumentCardMainContent = ({
  document,
  documentId,
  displayName,
}: DocumentCardMainContentProps) => (
  <>
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
      <FileText className="h-5 w-5 text-muted-foreground" />
    </div>
    <div className="min-w-0 flex-1 space-y-2">
      <p className="truncate text-sm font-semibold leading-none">
        {displayName}
      </p>
      <p className="truncate font-mono text-xs text-muted-foreground">
        {documentId}
      </p>
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Badge variant={stateVariant(document.state)} className="px-1.5 py-0 text-[0.65rem]">
          {document.state ?? 'UNKNOWN'}
        </Badge>
        <MetaDot />
        <MetaItem icon={HardDrive}>{formatBytes(document.sizeBytes)}</MetaItem>
        {document.mimeType && (
          <>
            <MetaDot />
            <MetaItem icon={FileType}>{document.mimeType}</MetaItem>
          </>
        )}
        <MetaDot />
        <MetaItem icon={Calendar}>{formatDate(document.createTime)}</MetaItem>
      </div>
    </div>
  </>
)

export const DocumentCard = ({
  document,
  storeId,
  search,
  hasActiveSelection = false,
  isSelected = false,
  onSelectedChange,
}: DocumentCardProps) => {
  const documentId = getDocumentId(document)
  const displayName = getDocumentDisplayName(document)

  return (
    <Card
      className={cn(
        'group/card flex-row items-center gap-4 px-5 py-5 transition-colors sm:px-6 sm:py-6',
        isSelected && 'border-primary bg-primary/5',
      )}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-muted/60 focus-within:bg-muted/60">
        <Checkbox
          checked={isSelected}
          aria-label={`Select ${displayName}`}
          className="data-[state=unchecked]:border-muted-foreground/35 data-[state=unchecked]:bg-muted/20"
          onCheckedChange={(checked) => onSelectedChange?.(checked === true)}
        />
      </div>

      <Link
        className="flex min-w-0 flex-1 items-center gap-4 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        to="/stores/$storeId/documents/$documentId"
        params={{ storeId, documentId }}
        search={search}
      >
        <DocumentCardMainContent
          document={document}
          documentId={documentId}
          displayName={displayName}
        />
      </Link>

      {!hasActiveSelection ? (
        <>
          <DeleteDocumentDialog
            document={document}
            storeId={storeId}
            trigger={
              <Button
                variant="ghost"
                size="icon-sm"
                className="group/delete-button shrink-0"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
              >
                <Trash2 className="h-4 w-4 text-muted-foreground transition-colors group-hover/delete-button:text-destructive" />
              </Button>
            }
          />
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover/card:translate-x-0.5" />
        </>
      ) : null}
    </Card>
  )
}
