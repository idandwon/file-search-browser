import { useState } from 'react'
import { ChevronDown, Link2, ScanSearch } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type { StoreQuerySource } from '@/lib/store-query/types'
import { cn } from '@/lib/utils'

type StoreQuerySourcesProps = {
  readonly sources: readonly StoreQuerySource[]
}

const getSourcesLabel = (count: number) => (count === 1 ? '1 source' : `${count} sources`)

const StoreQuerySourceCard = ({ source }: { readonly source: StoreQuerySource }) => (
  <Card>
    <CardHeader className="min-w-0">
      <CardTitle className="min-w-0 text-sm [overflow-wrap:anywhere]">
        {source.title}
      </CardTitle>
      {source.storeName ? (
        <CardDescription>{source.storeName}</CardDescription>
      ) : null}
    </CardHeader>
    <CardContent className="space-y-2">
      {source.snippet ? (
        <p className="text-sm text-muted-foreground [overflow-wrap:anywhere]">
          {source.snippet}
        </p>
      ) : null}
      {source.snippet && source.uri ? <Separator /> : null}
      {source.uri ? (
        <p className="flex items-center gap-2 text-xs text-muted-foreground [overflow-wrap:anywhere]">
          <Link2 className="h-3 w-3 shrink-0" />
          {source.uri}
        </p>
      ) : null}
    </CardContent>
  </Card>
)

export const StoreQuerySources = ({ sources }: StoreQuerySourcesProps) => {
  const [isOpen, setIsOpen] = useState(false)

  if (sources.length === 0) {
    return null
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm" className="h-auto justify-start gap-2 px-0">
          <ScanSearch className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">sources</span>
          <Badge variant="secondary">{getSourcesLabel(sources.length)}</Badge>
          <ChevronDown
            className={cn('h-4 w-4 text-muted-foreground', isOpen && 'rotate-180')}
          />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-3 space-y-3">
        {sources.map((source) => (
          <StoreQuerySourceCard key={source.id} source={source} />
        ))}
      </CollapsibleContent>
    </Collapsible>
  )
}
