import { Database, Plus } from 'lucide-react'
import { createFileRoute } from '@tanstack/react-router'
import { CreateStoreDialog } from '@/components/stores/create-store-dialog'
import { StoreList } from '@/components/stores/store-list'
import { validateListSearch } from '@/lib/shared/search/list-search'
import { Button } from '@/components/ui/button'

const StoresPage = () => (
  <div>
    <div className="h-10" />
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight">
        <Database className="h-6 w-6 text-muted-foreground" />
        Stores
      </h1>
      <CreateStoreDialog
        trigger={
          <Button className="sm:self-auto">
            <Plus />
            New Store
          </Button>
        }
      />
    </div>
    <StoreList />
  </div>
)

export const Route = createFileRoute('/')({
  validateSearch: validateListSearch,
  component: StoresPage,
})
