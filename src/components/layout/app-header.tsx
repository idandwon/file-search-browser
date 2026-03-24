import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useApiKey } from '@/hooks/use-api-key'

export const AppHeader = () => {
  const { logout, status } = useApiKey()

  return (
    <div className="bg-background">
      <header className="flex items-center justify-between px-6 py-3">
        <Link to="/" className="text-lg font-semibold tracking-tight">
          File Search Browser
        </Link>
        {status === 'authenticated' && (
          <Button variant="ghost" size="sm" onClick={logout}>
            Disconnect
          </Button>
        )}
      </header>
      <Separator />
    </div>
  )
}
