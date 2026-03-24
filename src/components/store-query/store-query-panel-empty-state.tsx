import { MessageSquareText } from 'lucide-react'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export const StoreQueryPanelEmptyState = () => (
  <Card className="mx-auto w-full max-w-lg">
    <CardHeader className="text-center">
      <CardTitle className="flex items-center justify-center gap-2">
        <MessageSquareText className="h-4 w-4" />
        Ask this store
      </CardTitle>
      <CardDescription>
        Summarize, compare, and ask follow-up questions grounded in the uploaded
        documents.
      </CardDescription>
    </CardHeader>
  </Card>
)
