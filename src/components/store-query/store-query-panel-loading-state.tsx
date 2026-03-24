import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const getMessageRowClassName = (isUser: boolean) =>
  cn('flex w-full', isUser ? 'justify-end' : 'justify-start')

const StoreQueryMessageSkeleton = ({ isUser }: { readonly isUser: boolean }) => (
  <div className={getMessageRowClassName(isUser)}>
    <Card className={cn('gap-0 py-0', isUser ? 'w-64 max-w-full' : 'w-full max-w-xl')}>
      <CardContent className="space-y-2 px-4 py-4">
        <Skeleton className="h-4 w-3/5" />
        <Skeleton className="h-4 w-full" />
        {isUser ? null : <Skeleton className="h-4 w-4/5" />}
      </CardContent>
    </Card>
  </div>
)

const StoreQueryComposerSkeleton = () => (
  <div className="mx-auto w-full max-w-3xl">
    <div className="grid min-h-9 grid-cols-[9rem_auto_minmax(0,1fr)_auto] items-center gap-2 rounded-md border border-input px-3 py-1 shadow-xs">
      <Skeleton className="h-4 w-24" />
      <Separator orientation="vertical" className="h-4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="size-6" />
    </div>
  </div>
)

export const StoreQueryPanelLoadingState = () => (
  <>
    <CardContent className="min-h-0 flex-1 px-0">
      <div className="mx-auto flex h-full w-full max-w-3xl flex-col justify-center gap-4 px-4 py-5 md:px-6 md:py-6">
        <StoreQueryMessageSkeleton isUser />
        <StoreQueryMessageSkeleton isUser={false} />
      </div>
    </CardContent>
    <Separator />
    <CardFooter className="shrink-0 items-stretch px-4 py-4 md:px-6">
      <StoreQueryComposerSkeleton />
    </CardFooter>
  </>
)
