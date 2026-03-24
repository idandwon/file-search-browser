import { useState, useCallback } from 'react'
import { getRouteApi, useNavigate } from '@tanstack/react-router'
import type { LucideIcon } from 'lucide-react'
import { Tag, HardDrive, FileType, Calendar, RefreshCw, Settings, ChevronDown, Trash2 } from 'lucide-react'
import { useDocument } from '@/hooks/documents/use-document'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorDisplay } from '@/components/shared/error-display'
import { TruncatedText } from '@/components/shared/truncated-text'
import { DeleteDocumentDialog } from './delete-document-dialog'
import type { CustomMetadata } from '@/lib/api/types'
import {
  formatMetadataValue,
  getDocumentDisplayName,
  stateVariant,
} from '@/lib/documents/presentation'
import { formatBytes, formatDate } from '@/lib/shared/format'

const documentDetailRouteApi = getRouteApi('/stores/$storeId/documents/$documentId')

type DetailRowProps = {
  readonly icon?: LucideIcon
  readonly label: string
  readonly value: string
}

const DetailRow = ({ icon: Icon, label, value }: DetailRowProps) => (
  <TableRow>
    <TableCell className="w-2/5 whitespace-nowrap">
      <span className="flex items-center gap-2 text-muted-foreground">
        {Icon && <Icon className="h-4 w-4" />}
        {label}
      </span>
    </TableCell>
    <TableCell className="max-w-0 text-right">
      <TruncatedText className="text-sm font-medium text-foreground">
        {value}
      </TruncatedText>
    </TableCell>
  </TableRow>
)

type MetadataToggleRowProps = {
  readonly count: number
  readonly isOpen: boolean
  readonly onToggle: () => void
}

const MetadataToggleRow = ({ count, isOpen, onToggle }: MetadataToggleRowProps) => (
  <TableRow
    className="cursor-pointer"
    onClick={onToggle}
  >
    <TableCell className="whitespace-nowrap">
      <span className="flex items-center gap-2 text-muted-foreground">
        <Settings className="h-4 w-4" />
        Custom Metadata ({count})
      </span>
    </TableCell>
    <TableCell className="text-right">
      <ChevronDown
        className={`ml-auto h-4 w-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`}
      />
    </TableCell>
  </TableRow>
)

type MetadataRowProps = {
  readonly meta: CustomMetadata
}

const MetadataRow = ({ meta }: MetadataRowProps) => (
  <TableRow>
    <TableCell className="w-2/5 whitespace-nowrap ps-8 font-medium">{meta.key}</TableCell>
    <TableCell className="max-w-0 text-right">
      <TruncatedText className="text-sm text-foreground">
        {formatMetadataValue(meta)}
      </TruncatedText>
    </TableCell>
  </TableRow>
)

const DocumentDetailSkeleton = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-6 w-64" />
    </CardHeader>
    <CardContent className="flex flex-col gap-3">
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="flex items-center justify-between py-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-40" />
        </div>
      ))}
    </CardContent>
  </Card>
)

type DocumentDetailProps = {
  readonly storeId: string
  readonly documentId: string
}

export const DocumentDetail = ({ storeId, documentId }: DocumentDetailProps) => {
  const [isMetadataOpen, setIsMetadataOpen] = useState(false)
  const { data: document, error, status, refetch } = useDocument(storeId, documentId)
  const navigate = useNavigate()
  const search = documentDetailRouteApi.useSearch()

  const toggleMetadata = useCallback(() => {
    setIsMetadataOpen((prev) => !prev)
  }, [])

  if (status === 'pending') return <DocumentDetailSkeleton />
  if (status === 'error') return <ErrorDisplay error={error} onRetry={() => refetch()} />

  const hasMetadata = document.customMetadata && document.customMetadata.length > 0

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <CardTitle className="leading-tight">
              <TruncatedText
                truncate={false}
                className="[overflow-wrap:anywhere]"
                tooltipContentClassName="max-w-md break-words"
              >
                {getDocumentDisplayName(document)}
              </TruncatedText>
            </CardTitle>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
            <Badge variant={stateVariant(document.state)}>
              {document.state ?? 'UNKNOWN'}
            </Badge>
            <DeleteDocumentDialog
              document={document}
              storeId={storeId}
              trigger={
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              }
              onDeleted={() => navigate({
                to: '/stores/$storeId',
                params: { storeId },
                search,
              })}
            />
          </div>
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="overflow-hidden">
        <Table className="table-fixed">
          <TableBody>
            <DetailRow icon={Tag} label="Resource Name" value={document.name ?? '—'} />
            <DetailRow icon={HardDrive} label="Size" value={formatBytes(document.sizeBytes)} />
            <DetailRow icon={FileType} label="MIME Type" value={document.mimeType ?? '—'} />
            <DetailRow icon={Calendar} label="Created" value={formatDate(document.createTime)} />
            <DetailRow icon={RefreshCw} label="Updated" value={formatDate(document.updateTime)} />
            {hasMetadata && (
              <>
                <MetadataToggleRow
                  count={document.customMetadata!.length}
                  isOpen={isMetadataOpen}
                  onToggle={toggleMetadata}
                />
                {isMetadataOpen &&
                  document.customMetadata!.map((meta) => (
                    <MetadataRow key={meta.key} meta={meta} />
                  ))}
              </>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
