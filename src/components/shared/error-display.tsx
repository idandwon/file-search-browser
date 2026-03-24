import { ApiError } from '@google/genai'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  getGeminiAuthenticationErrorMessage,
  isGeminiAuthenticationError,
} from '@/lib/auth/gemini-api-key-validator'

type ErrorDisplayProps = {
  readonly error: Error
  readonly onRetry?: () => void
}

const getErrorMessage = (error: Error): string => {
  if (isGeminiAuthenticationError(error)) {
    return getGeminiAuthenticationErrorMessage(error)
  }

  if (error instanceof ApiError) {
    return `API error: ${error.status} - ${error.message}`
  }

  return error.message || 'An unexpected error occurred.'
}

export const ErrorDisplay = ({ error, onRetry }: ErrorDisplayProps) => (
  <Alert variant="destructive" className="mx-auto max-w-lg">
    <AlertTitle>Something went wrong</AlertTitle>
    <AlertDescription className="mt-2">
      <p>{getErrorMessage(error)}</p>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="mt-3"
        >
          Try again
        </Button>
      )}
    </AlertDescription>
  </Alert>
)
