import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardHeader } from '@/components/ui/card'

const SKELETON_COUNT = 6

export const DocumentListSkeleton = () => (
  <div className="flex flex-col gap-3">
    {Array.from({ length: SKELETON_COUNT }, (_, i) => (
      <Card key={i}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-56" />
            <Skeleton className="h-5 w-16" />
          </div>
          <Skeleton className="h-4 w-64" />
        </CardHeader>
      </Card>
    ))}
  </div>
)
