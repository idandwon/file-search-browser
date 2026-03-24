import {
  useCallback,
  useId,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from 'react'
import { Plus, Loader2 } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useCreateStore } from '@/hooks/stores/use-create-store'
import {
  MAX_STORE_DISPLAY_NAME_LENGTH,
  getCreateStoreError,
  hasStoreDisplayName,
  isStoreDisplayNameTooLong,
  normalizeStoreDisplayName,
} from '@/lib/stores/create-store-policy'

type CreateStoreDialogProps = {
  readonly trigger: ReactNode
}

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message
  return 'Store creation failed.'
}

const getCharacterCount = (value: string): number =>
  normalizeStoreDisplayName(value).length

const CreateStoreError = ({ message }: { readonly message: string | null }) => {
  if (!message) return null

  return (
    <Alert variant="destructive">
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  )
}

export const CreateStoreDialog = ({ trigger }: CreateStoreDialogProps) => {
  const inputId = useId()
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const mutation = useCreateStore()
  const navigate = useNavigate()

  const reset = useCallback(() => {
    setValue('')
    setError(null)
  }, [])

  const handleOpenChange = useCallback((nextOpen: boolean) => {
    if (!nextOpen) reset()
    setOpen(nextOpen)
  }, [reset])

  const handleChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    if (error) setError(null)
    setValue(event.target.value)
  }, [error])

  const handleSubmit = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    try {
      const result = await mutation.mutateAsync(value)
      reset()
      setOpen(false)
      void navigate({ to: '/stores/$storeId', params: { storeId: result.storeId } })
    } catch (nextError) {
      setError(getErrorMessage(nextError))
    }
  }, [mutation, navigate, reset, value])

  const characterCount = useMemo(() => getCharacterCount(value), [value])
  const validationError = useMemo(() => {
    if (!isStoreDisplayNameTooLong(value)) return null
    return getCreateStoreError(value)
  }, [value])
  const isPending = mutation.isPending
  const isDisabled =
    isPending || !hasStoreDisplayName(value) || validationError !== null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Store</DialogTitle>
          <DialogDescription>
            Create a Gemini file search store with a display name.
          </DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <label htmlFor={inputId} className="text-sm font-medium">
                Store name
              </label>
              <span className="text-xs text-muted-foreground">
                {characterCount}/{MAX_STORE_DISPLAY_NAME_LENGTH}
              </span>
            </div>
            <Input
              id={inputId}
              value={value}
              onChange={handleChange}
              placeholder="Quarterly Reports"
              maxLength={MAX_STORE_DISPLAY_NAME_LENGTH + 1}
              disabled={isPending}
              aria-invalid={validationError !== null || error !== null}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Use a clear name so the store is easy to find later.
            </p>
          </div>
          <CreateStoreError message={validationError ?? error} />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isDisabled}>
              {isPending ? <Loader2 className="animate-spin" /> : <Plus />}
              {isPending ? 'Creating...' : 'Create Store'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
