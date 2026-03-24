import { ArrowRight, Eye, EyeOff, LoaderCircle } from 'lucide-react'
import { type SubmitEvent, useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AuthShell } from './auth-shell'
import { useApiKey } from '@/hooks/use-api-key'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  CardAction,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'

const LOCAL_DEV_API_KEY = __LOCAL_DEV_GEMINI_API_KEY__?.trim() || null

export const ApiKeyForm = () => {
  const {
    apiKey,
    authenticate,
    errorMessage,
    rememberApiKey,
    status,
  } = useApiKey()
  const [value, setValue] = useState(apiKey ?? LOCAL_DEV_API_KEY ?? '')
  const [isApiKeyVisible, setIsApiKeyVisible] = useState(false)
  const [shouldRememberApiKey, setShouldRememberApiKey] = useState(rememberApiKey)
  const isSubmitting = status === 'authenticating'
  const isInvalid = Boolean(errorMessage)

  const handleSubmit = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()

    const trimmed = value.trim()
    if (!trimmed || isSubmitting) return

    void authenticate(trimmed, { remember: shouldRememberApiKey })
  }

  return (
    <AuthShell>
      <Card className="w-full">
        <form onSubmit={handleSubmit}>
          <CardHeader className="gap-1 pb-4">
            <CardAction>
              <Badge variant="outline">Internal</Badge>
            </CardAction>
            <CardTitle>File Search Browser</CardTitle>
            <CardDescription>
              Use your Gemini API key to sign in.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 pb-4">
            <Separator />

            <div className="grid gap-2">
              <label htmlFor="gemini-api-key" className="text-sm font-medium">
                API key
              </label>
              <div className="relative">
                <Input
                  id="gemini-api-key"
                  type={isApiKeyVisible ? 'text' : 'password'}
                  placeholder="Enter your API key"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  autoFocus
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  disabled={isSubmitting}
                  aria-invalid={isInvalid}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => setIsApiKeyVisible((visible) => !visible)}
                  disabled={isSubmitting}
                  aria-label={isApiKeyVisible ? 'Hide API key' : 'Show API key'}
                  aria-pressed={isApiKeyVisible}
                  className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {isApiKeyVisible ? <EyeOff /> : <Eye />}
                </Button>
              </div>
            </div>

            <div className="grid gap-2">
              <div className="flex w-full min-w-0 items-start gap-3 rounded-md border border-border bg-muted/30 p-3 text-sm">
                <Checkbox
                  id="remember-api-key"
                  className="mt-0.5 shrink-0"
                  checked={shouldRememberApiKey}
                  onCheckedChange={(checked) =>
                    setShouldRememberApiKey(checked === true)
                  }
                  disabled={isSubmitting}
                  aria-describedby="remember-api-key-description"
                />
                <span className="min-w-0 flex-1">
                  <label
                    htmlFor="remember-api-key"
                    className="block leading-5 text-foreground"
                  >
                    Remember API key
                  </label>
                  <span
                    id="remember-api-key-description"
                    className="block text-xs leading-5 text-muted-foreground"
                  >
                    Browser storage is not ideal for secrets.{' '}
                    <a
                      href="https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html#html5-web-storage-api"
                      target="_blank"
                      rel="noreferrer noopener"
                      className="underline decoration-current/60 underline-offset-4 transition-colors hover:text-foreground"
                    >
                      Read more
                    </a>
                  </span>
                </span>
              </div>
            </div>

            {errorMessage && (
              <Alert variant="destructive">
                <AlertDescription>
                  <p>{errorMessage}</p>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>

          <CardFooter>
            <Button
              type="submit"
              disabled={!value.trim() || isSubmitting}
              className="group w-full"
            >
              {isSubmitting ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <>
                  <ArrowRight className="transition-transform duration-200 group-hover:translate-x-0.5 group-focus-visible:translate-x-0.5 motion-reduce:transform-none" />
                  Continue
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </AuthShell>
  )
}
