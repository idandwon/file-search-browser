import { LoaderCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  CardAction,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'

export const ApiKeyValidationPanel = () => (
  <Card className="w-full">
    <CardHeader className="gap-1 pb-4">
      <CardAction>
        <Badge variant="outline">Internal</Badge>
      </CardAction>
      <CardTitle className="flex items-center gap-2">
        <LoaderCircle className="animate-spin" />
        Loading
      </CardTitle>
      <CardDescription>
        Checking your saved API key before opening the workspace.
      </CardDescription>
    </CardHeader>

    <CardContent className="space-y-4 pb-6">
      <Separator />
      <Skeleton className="h-9 w-full" />
      <Skeleton className="h-9 w-2/3" />
    </CardContent>
  </Card>
)
