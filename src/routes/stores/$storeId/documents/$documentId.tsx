import { createFileRoute, useParams } from '@tanstack/react-router'
import { DocumentDetail } from '@/components/documents/document-detail'

const DocumentPage = () => {
  const { storeId, documentId } = useParams({
    from: '/stores/$storeId/documents/$documentId',
  })

  return <DocumentDetail storeId={storeId} documentId={documentId} />
}

export const Route = createFileRoute('/stores/$storeId/documents/$documentId')({
  component: DocumentPage,
})
