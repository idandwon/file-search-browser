import { FileText } from 'lucide-react'
import {
  createFileRoute,
  getRouteApi,
  Link,
  Outlet,
  useMatches,
  useParams,
} from '@tanstack/react-router'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Skeleton } from '@/components/ui/skeleton'
import { TruncatedText } from '@/components/shared/truncated-text'
import { useDocument } from '@/hooks/documents/use-document'
import { useStore } from '@/hooks/stores/use-store'
import { validateDocumentListSearch } from '@/lib/documents/list-search'

const storeRouteApi = getRouteApi('/stores/$storeId')

const useBreadcrumbs = (storeId: string) => {
  const matches = useMatches()
  const docMatch = matches.find((m) => 'documentId' in (m.params as Record<string, unknown>))
  const documentId = (docMatch?.params as { documentId?: string })?.documentId ?? ''

  const { data: store, isLoading: isStoreLoading } = useStore(storeId)
  const { data: document, isLoading: isDocLoading } = useDocument(storeId, documentId)

  const storeLabel = isStoreLoading ? null : (store?.displayName ?? storeId)
  const documentLabel = isDocLoading ? null : (document?.displayName ?? documentId)
  const title = store?.displayName ?? storeId

  return { documentId, documentLabel, storeLabel, title }
}

const BreadcrumbLabel = ({ label }: { readonly label: string | null }) => {
  if (label === null) return <Skeleton className="h-3 w-20 max-w-full" />
  return <TruncatedText className="max-w-full">{label}</TruncatedText>
}

const StoreLayout = () => {
  const { storeId } = useParams({ from: '/stores/$storeId' })
  const search = storeRouteApi.useSearch()
  const { documentId, documentLabel, storeLabel, title } = useBreadcrumbs(storeId)

  return (
    <div>
      <div className="flex h-10 min-w-0 items-center">
        <Breadcrumb className="min-w-0 flex-1">
          <BreadcrumbList className="w-full min-w-0 flex-nowrap text-xs">
            <BreadcrumbItem className="shrink-0">
              <BreadcrumbLink asChild>
                <Link to="/" className="block shrink-0">
                  <BreadcrumbLabel label="Stores" />
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="shrink-0" />
            {documentId ? (
              <>
                <BreadcrumbItem className="min-w-0">
                  <BreadcrumbLink asChild>
                    <Link
                      to="/stores/$storeId"
                      params={{ storeId }}
                      search={search}
                      className="block min-w-0 max-w-full"
                    >
                      <BreadcrumbLabel label={storeLabel} />
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="shrink-0" />
                <BreadcrumbItem className="min-w-0">
                  <BreadcrumbPage className="block min-w-0 max-w-full">
                    <BreadcrumbLabel label={documentLabel} />
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </>
            ) : (
              <BreadcrumbItem className="min-w-0">
                <BreadcrumbPage className="block min-w-0 max-w-full">
                  <BreadcrumbLabel label={storeLabel} />
                </BreadcrumbPage>
              </BreadcrumbItem>
            )}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <h1 className="mb-6 flex min-w-0 items-center gap-2.5 text-2xl font-bold tracking-tight">
        <FileText className="h-6 w-6 text-muted-foreground" />
        <span className="min-w-0 [overflow-wrap:anywhere]">{title}</span>
      </h1>
      <Outlet />
    </div>
  )
}

export const Route = createFileRoute('/stores/$storeId')({
  validateSearch: validateDocumentListSearch,
  component: StoreLayout,
})
