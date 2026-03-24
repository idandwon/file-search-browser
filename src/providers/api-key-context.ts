import { createContext } from 'react'
import type { AuthStatus } from '@/lib/auth/types'

export type AuthenticateApiKeyOptions = {
  readonly remember?: boolean
}

export type ApiKeyContextValue = {
  readonly apiKey: string | null
  readonly rememberApiKey: boolean
  readonly status: AuthStatus
  readonly errorMessage: string | null
  readonly authenticate: (
    key: string,
    options?: AuthenticateApiKeyOptions,
  ) => Promise<boolean>
  readonly handleAuthError: (error: unknown) => boolean
  readonly logout: () => void
}

export const ApiKeyContext = createContext<ApiKeyContextValue | null>(null)
