import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ApiKeyProvider } from '@/providers/api-key-provider'
import { GeminiProvider } from '@/providers/gemini-provider'
import { QueryProvider } from '@/providers/query-provider'
import { ApiKeyGuard } from '@/components/auth/api-key-guard'
import { AppHeader } from '@/components/layout/app-header'
import { useApiKey } from '@/hooks/use-api-key'

const RootContent = () => {
  const { status } = useApiKey()

  if (status !== 'authenticated') {
    return (
      <div className="min-h-[100svh] text-foreground">
        <ApiKeyGuard>
          <Outlet />
        </ApiKeyGuard>
      </div>
    )
  }

  return (
    <div className="min-h-[100svh] text-foreground">
      <AppHeader />
      <main className="mx-auto max-w-4xl p-4">
        <ApiKeyGuard>
          <Outlet />
        </ApiKeyGuard>
      </main>
    </div>
  )
}

const RootLayout = () => (
  <ApiKeyProvider>
    <GeminiProvider>
      <QueryProvider>
        <TooltipProvider>
          <RootContent />
        </TooltipProvider>
      </QueryProvider>
    </GeminiProvider>
  </ApiKeyProvider>
)

export const Route = createRootRoute({ component: RootLayout })
