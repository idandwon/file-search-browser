import { createFileRoute, useParams } from '@tanstack/react-router'
import { DocumentList } from '@/components/documents/document-list'
import { Upload } from 'lucide-react'
import { UploadDocumentDialog } from '@/components/documents/upload-document-dialog'
import { StoreQueryDialog } from '@/components/store-query/store-query-dialog'
import { StoreQueryDialogLifecycleProvider } from '@/components/store-query/store-query-dialog-lifecycle'
import { StoreQueryToggleButton } from '@/components/store-query/store-query-toggle-button'
import { Button } from '@/components/ui/button'

const StoreDocumentsActions = ({ storeId }: { readonly storeId: string }) => (
  <div className="flex flex-wrap items-center justify-end gap-2">
    <StoreQueryToggleButton />
    <UploadDocumentDialog
      storeId={storeId}
      trigger={
        <Button>
          <Upload className="h-4 w-4" />
          Upload
        </Button>
      }
    />
  </div>
)

const StoreDocumentsPage = () => {
  const { storeId } = useParams({ from: '/stores/$storeId/' })

  return (
    <StoreQueryDialogLifecycleProvider key={storeId}>
      <DocumentList
        key={storeId}
        storeId={storeId}
        toolbarActions={<StoreDocumentsActions storeId={storeId} />}
      />
      <StoreQueryDialog storeId={storeId} />
    </StoreQueryDialogLifecycleProvider>
  )
}

export const Route = createFileRoute('/stores/$storeId/')({
  component: StoreDocumentsPage,
})
