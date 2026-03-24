import { useCallback, useMemo, useState } from 'react'
import { getRouteApi, useNavigate } from '@tanstack/react-router'
import {
  AlertTriangle,
  FileText,
  SearchX,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { useDocuments } from '@/hooks/documents/use-documents'
import { type DeleteDocumentsResult } from '@/hooks/documents/use-delete-documents'
import { useVisibleDocuments } from '@/hooks/documents/use-visible-documents'
import { useBackgroundSearchPagination } from '@/hooks/search/use-background-search-pagination'
import { useListSearchState } from '@/hooks/search/use-list-search-state'
import { getDocumentDisplayName, getDocumentId } from '@/lib/documents/presentation'
import { hasDocumentSearchMatch } from '@/lib/documents/search'
import type { Document } from '@/lib/api/types'
import { buildListSearch } from '@/lib/shared/search/list-search'
import { BulkDeleteDocumentsDialog } from './bulk-delete-documents-dialog'
import { DocumentCard } from './document-card'
import { DocumentListSkeleton } from './document-list-skeleton'
import { UploadDocumentDialog } from './upload-document-dialog'
import { ScrollTrigger } from '@/components/shared/scroll-trigger'
import { SearchInput } from '@/components/shared/search-input'
import { EmptyState } from '@/components/shared/empty-state'
import { ErrorDisplay } from '@/components/shared/error-display'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { SearchLoadMoreAction } from '@/components/shared/search-load-more-action'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

const DEBOUNCE_MS = 300
const MAX_FAILED_DOCUMENT_PREVIEW = 3
const SELECT_LOADED_LABEL = 'Select loaded documents'
const storeDocumentsIndexRouteApi = getRouteApi('/stores/$storeId/')

type DocumentListProps = {
  readonly storeId: string
  readonly toolbarActions?: ReactNode
}

type FailedDocumentSummary = {
  readonly id: string
  readonly displayName: string
}

type BulkDeleteSummary = {
  readonly deletedCount: number
  readonly failedDocuments: readonly FailedDocumentSummary[]
}

type ToolbarIconButtonProps = React.ComponentProps<typeof Button> & {
  readonly tooltip: string
}

const createEmptySelection = (): Set<string> => new Set<string>()

const toggleSelectedDocumentId = (
  selectedDocumentIds: ReadonlySet<string>,
  documentId: string,
  checked: boolean,
): Set<string> => {
  const nextSelection = new Set(selectedDocumentIds)

  if (checked) {
    nextSelection.add(documentId)
  } else {
    nextSelection.delete(documentId)
  }

  return nextSelection
}

const toBulkDeleteSummary = (
  result: DeleteDocumentsResult,
  documents: readonly Document[],
): BulkDeleteSummary | null => {
  if (result.failedIds.length === 0) return null

  const documentsById = new Map(
    documents.map((document) => [getDocumentId(document), document] as const),
  )

  return {
    deletedCount: result.deletedIds.length,
    failedDocuments: result.failedIds.map((documentId) => {
      const document = documentsById.get(documentId)

      return {
        id: documentId,
        displayName: document
          ? getDocumentDisplayName(document)
          : documentId,
      }
    }),
  }
}

const getDeletedSummaryText = (deletedCount: number): string =>
  deletedCount === 0
    ? 'No documents were deleted.'
    : deletedCount === 1
      ? 'Deleted 1 document.'
      : `Deleted ${deletedCount} documents.`

const getFailedSummaryText = (failedCount: number): string =>
  failedCount === 1
    ? '1 document could not be deleted.'
    : `${failedCount} documents could not be deleted.`

const ToolbarIconButton = ({
  tooltip,
  children,
  className,
  ...props
}: ToolbarIconButtonProps) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        size="icon-sm"
        variant="ghost"
        className={cn('shrink-0', className)}
        {...props}
      >
        {children}
        <span className="sr-only">{tooltip}</span>
      </Button>
    </TooltipTrigger>
    <TooltipContent sideOffset={8}>{tooltip}</TooltipContent>
  </Tooltip>
)

const SelectionToolbarCheckbox = ({
  checked,
  disabled,
  onCheckedChange,
}: {
  readonly checked: boolean | 'indeterminate'
  readonly disabled: boolean
  readonly onCheckedChange: (checked: boolean) => void
}) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Checkbox
        checked={checked}
        disabled={disabled}
        aria-label={SELECT_LOADED_LABEL}
        className="size-5 data-[state=unchecked]:border-muted-foreground/40 data-[state=unchecked]:bg-muted/20"
        onCheckedChange={(nextChecked) => onCheckedChange(nextChecked === true)}
      />
    </TooltipTrigger>
    <TooltipContent sideOffset={8}>{SELECT_LOADED_LABEL}</TooltipContent>
  </Tooltip>
)

const BulkDeleteStatus = ({
  summary,
}: {
  readonly summary: BulkDeleteSummary
}) => {
  const failedDocumentPreview = summary.failedDocuments
    .slice(0, MAX_FAILED_DOCUMENT_PREVIEW)
    .map((document) => document.displayName)
  const hiddenFailedCount = Math.max(
    0,
    summary.failedDocuments.length - MAX_FAILED_DOCUMENT_PREVIEW,
  )
  const failedDocumentText = failedDocumentPreview.length > 0
    ? ` Still selected: ${failedDocumentPreview.join(', ')}${hiddenFailedCount > 0 ? `, +${hiddenFailedCount} more` : ''}`
    : ''

  return (
    <div className="flex items-center gap-2 rounded-md border border-destructive/15 bg-destructive/5 px-3 py-2 text-sm text-destructive">
      <AlertTriangle className="h-4 w-4 shrink-0" />
      <p className="min-w-0 truncate">
        {getDeletedSummaryText(summary.deletedCount)}{' '}
        {getFailedSummaryText(summary.failedDocuments.length)}
        {failedDocumentText}
      </p>
    </div>
  )
}

export const DocumentList = ({
  storeId,
  toolbarActions,
}: DocumentListProps) => {
  const navigate = useNavigate({ from: '/stores/$storeId/' })
  const { q } = storeDocumentsIndexRouteApi.useSearch()
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<Set<string>>(
    createEmptySelection,
  )
  const [bulkDeleteSummary, setBulkDeleteSummary] = useState<BulkDeleteSummary | null>(null)

  const setSearch = useCallback(
    (nextValue: string) => {
      void navigate({
        replace: true,
        search: buildListSearch(nextValue),
      })
    },
    [navigate],
  )

  const {
    inputValue: search,
    setInputValue: setSearchInputValue,
    query: searchQuery,
    hasActiveSearch,
    canRunSearchPagination,
    searchRunScopeKey,
  } = useListSearchState({
    scopeKey: storeId,
    value: q ?? '',
    onChange: setSearch,
    debounceMs: DEBOUNCE_MS,
  })

  const browseDocumentsQuery = useDocuments(storeId, { mode: 'browse' })
  const searchDocumentsQuery = useDocuments(storeId, {
    mode: 'search',
    enabled: hasActiveSearch,
  })
  const isSearchBootstrapLoading =
    hasActiveSearch &&
    searchDocumentsQuery.status === 'pending' &&
    searchDocumentsQuery.loadedPageCount === 0
  const activeDocumentsQuery = hasActiveSearch
    ? searchDocumentsQuery
    : browseDocumentsQuery
  const documents = useVisibleDocuments({
    documents: hasActiveSearch
      ? searchDocumentsQuery.items
      : browseDocumentsQuery.items,
    search: hasActiveSearch ? searchQuery : '',
  })
  const documentSearch = buildListSearch(search)
  const backgroundSearch = useBackgroundSearchPagination({
    isSearchActive: canRunSearchPagination,
    runScopeKey: searchRunScopeKey,
    hasLoadedMatch: hasActiveSearch && documents.length > 0,
    hasNextPage: activeDocumentsQuery.hasNextPage,
    isFetchingNextPage: activeDocumentsQuery.isFetchingNextPage,
    loadedPageCount: activeDocumentsQuery.loadedPageCount,
    nextCursor: activeDocumentsQuery.nextCursor,
    dataUpdatedAt: activeDocumentsQuery.dataUpdatedAt,
    query: searchQuery,
    fetchNextPage: () => searchDocumentsQuery.fetchNextPage({ cancelRefetch: false }),
    pageContainsMatch: (page, query) => hasDocumentSearchMatch({
      items: page.documents ?? [],
      query,
    }),
  })

  const visibleDocumentIds = useMemo(
    () => documents.map((document) => getDocumentId(document)),
    [documents],
  )
  const selectedVisibleDocumentIds = useMemo(
    () =>
      new Set(
        visibleDocumentIds.filter((documentId) =>
          selectedDocumentIds.has(documentId)),
      ),
    [selectedDocumentIds, visibleDocumentIds],
  )
  const selectedDocuments = useMemo(
    () =>
      documents.filter((document) =>
        selectedVisibleDocumentIds.has(getDocumentId(document))),
    [documents, selectedVisibleDocumentIds],
  )
  const selectedCount = selectedDocuments.length
  const hasSelection = selectedCount > 0
  const allVisibleSelected =
    documents.length > 0 && selectedCount === documents.length
  const selectAllState =
    allVisibleSelected
      ? true
      : selectedCount > 0
        ? 'indeterminate'
        : false

  const clearSelection = useCallback(() => {
    setSelectedDocumentIds(createEmptySelection())
  }, [])

  const clearSelectionFeedback = useCallback(() => {
    setBulkDeleteSummary(null)
  }, [])

  const clearAllSelectionState = useCallback(() => {
    clearSelection()
    clearSelectionFeedback()
  }, [clearSelection, clearSelectionFeedback])

  const handleSearchChange = useCallback(
    (nextValue: string) => {
      clearAllSelectionState()
      setSearchInputValue(nextValue)
    },
    [clearAllSelectionState, setSearchInputValue],
  )

  const handleDocumentSelectionChange = useCallback(
    (documentId: string, checked: boolean) => {
      setSelectedDocumentIds(
        toggleSelectedDocumentId(selectedVisibleDocumentIds, documentId, checked),
      )
      clearSelectionFeedback()
    },
    [clearSelectionFeedback, selectedVisibleDocumentIds],
  )

  const handleSelectAllLoadedChange = useCallback(
    (checked: boolean) => {
      setSelectedDocumentIds(
        checked ? new Set(visibleDocumentIds) : createEmptySelection(),
      )
      clearSelectionFeedback()
    },
    [clearSelectionFeedback, visibleDocumentIds],
  )

  const handleBulkDeleteCompleted = useCallback(
    (result: DeleteDocumentsResult) => {
      setSelectedDocumentIds(() => new Set(result.failedIds))
      setBulkDeleteSummary(toBulkDeleteSummary(result, selectedDocuments))
    },
    [selectedDocuments],
  )

  if (!hasActiveSearch && browseDocumentsQuery.status === 'pending') {
    return <DocumentListSkeleton />
  }

  if (!hasActiveSearch && browseDocumentsQuery.status === 'error') {
    return (
      <ErrorDisplay
        error={browseDocumentsQuery.error}
        onRetry={() => browseDocumentsQuery.refetch()}
      />
    )
  }

  if (
    hasActiveSearch &&
    searchDocumentsQuery.status === 'error' &&
    searchDocumentsQuery.loadedPageCount === 0
  ) {
    return (
      <ErrorDisplay
        error={searchDocumentsQuery.error}
        onRetry={() => searchDocumentsQuery.refetch()}
      />
    )
  }

  const searchLoadMoreAction =
    hasActiveSearch &&
    (backgroundSearch.isLoading || backgroundSearch.canManualLoadMore)
      ? (
          <SearchLoadMoreAction
            isLoading={backgroundSearch.isLoading}
            canLoadMore={backgroundSearch.canManualLoadMore}
            onLoadMore={backgroundSearch.start}
            loadingLabel="Searching more documents..."
          />
        )
      : undefined
  const isBackgroundSearchLoadingWithoutResults =
    hasActiveSearch &&
    documents.length === 0 &&
    (
      backgroundSearch.isLoading ||
      (
        activeDocumentsQuery.hasNextPage === true &&
        backgroundSearch.runState !== 'exhausted' &&
        backgroundSearch.runState !== 'error'
      )
    )

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="w-full flex-1">
          <SearchInput
            value={search}
            onChange={handleSearchChange}
            placeholder="Search documents by name or ID..."
          />
        </div>

        {hasSelection ? (
          <div className="flex h-9 w-full items-center justify-between gap-2 rounded-md border border-border/70 bg-muted/25 px-2 sm:w-auto sm:justify-start">
            <SelectionToolbarCheckbox
              checked={selectAllState}
              disabled={documents.length === 0}
              onCheckedChange={handleSelectAllLoadedChange}
            />
            <span className="min-w-0 px-1 text-sm font-medium text-foreground/90">
              {selectedCount} selected
            </span>
            <Separator orientation="vertical" className="h-5" />
            <BulkDeleteDocumentsDialog
              documents={selectedDocuments}
              storeId={storeId}
              disabled={selectedCount === 0}
              onCompleted={handleBulkDeleteCompleted}
              trigger={
                <ToolbarIconButton
                  tooltip="Delete selected"
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </ToolbarIconButton>
              }
            />
            <ToolbarIconButton
              tooltip="Clear selection"
              onClick={clearAllSelectionState}
            >
              <X className="h-4 w-4" />
            </ToolbarIconButton>
          </div>
        ) : (
          <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
            {toolbarActions ?? (
              <UploadDocumentDialog
                storeId={storeId}
                trigger={
                  <Button className="w-full sm:w-auto">
                    <Upload className="h-4 w-4" />
                    Upload
                  </Button>
                }
              />
            )}
            <SelectionToolbarCheckbox
              checked={selectAllState}
              disabled={documents.length === 0}
              onCheckedChange={handleSelectAllLoadedChange}
            />
          </div>
        )}
      </div>

      {bulkDeleteSummary ? (
        <BulkDeleteStatus summary={bulkDeleteSummary} />
      ) : null}

      {isSearchBootstrapLoading ? (
        <div className="flex min-h-40 items-center justify-center">
          <LoadingSpinner label="Searching documents" />
        </div>
      ) : isBackgroundSearchLoadingWithoutResults ? (
        <div className="flex min-h-40 items-center justify-center">
          <LoadingSpinner label="Searching more documents..." />
        </div>
      ) : documents.length === 0 ? (
        <EmptyState
          icon={hasActiveSearch ? SearchX : FileText}
          title="No documents found"
          description={
            hasActiveSearch
              ? 'No documents match your search. Try a different term.'
              : 'Upload documents to this store to see them here.'
          }
          action={searchLoadMoreAction}
        />
      ) : (
        <div className="flex flex-col gap-4">
          {documents.map((doc) => {
            const documentId = getDocumentId(doc)

            return (
              <DocumentCard
                key={doc.name}
                document={doc}
                storeId={storeId}
                search={documentSearch}
                hasActiveSelection={hasSelection}
                isSelected={selectedVisibleDocumentIds.has(documentId)}
                onSelectedChange={(checked) =>
                  handleDocumentSelectionChange(documentId, checked)}
              />
            )
          })}
          <ScrollTrigger
            enabled={!hasActiveSearch && browseDocumentsQuery.hasNextPage === true}
            isFetching={!hasActiveSearch && browseDocumentsQuery.isFetchingNextPage}
            onAutoLoadMore={() => {
              void browseDocumentsQuery.fetchNextPage()
            }}
            footer={searchLoadMoreAction}
          />
          {activeDocumentsQuery.isFetching && !activeDocumentsQuery.isFetchingNextPage ? (
            <div className="flex min-h-8 items-center justify-center">
              <LoadingSpinner label="Refreshing documents" />
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
