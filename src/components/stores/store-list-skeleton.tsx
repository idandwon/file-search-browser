import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardHeader } from '@/components/ui/card'

const SKELETON_COUNT = 6

export const StoreListSkeleton = () => (
  <div className="flex flex-col gap-3">
    {Array.from({ length: SKELETON_COUNT }, (_, i) => (
      <Card key={i}>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
      </Card>
    ))}
  </div>
)
