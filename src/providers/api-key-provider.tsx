import {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
  type ReactNode,
} from 'react'
import {
  type ApiKeyStorage,
  createDefaultApiKeyStorage,
} from '@/lib/auth/api-key-storage'
import { geminiApiKeyValidator } from '@/lib/auth/gemini-api-key-validator'
import type { AuthStatus, CredentialValidator } from '@/lib/auth/types'
import {
  ApiKeyContext,
  type ApiKeyContextValue,
  type AuthenticateApiKeyOptions,
} from './api-key-context'

type ApiKeySession = {
  readonly apiKey: string | null
  readonly rememberApiKey: boolean
  readonly status: AuthStatus
  readonly errorMessage: string | null
}

type ApiKeyProviderProps = {
  readonly children: ReactNode
  readonly storage?: ApiKeyStorage
  readonly validator?: CredentialValidator<string>
}

const noopStorage: ApiKeyStorage = {
  save: () => {},
  load: () => null,
  clear: () => {},
}

const createSafeDefaultStorage = (): ApiKeyStorage => {
  try {
    return createDefaultApiKeyStorage()
  } catch {
    return noopStorage
  }
}

const defaultStorage = createSafeDefaultStorage()

const createMissingSession = (
  rememberApiKey: boolean = true,
): ApiKeySession => ({
  apiKey: null,
  rememberApiKey,
  status: 'missing',
  errorMessage: null,
})

const createInitialSession = (storage: ApiKeyStorage): ApiKeySession => {
  const storedApiKey = storage.load()

  if (!storedApiKey) {
    return createMissingSession()
  }

  return {
    apiKey: storedApiKey,
    rememberApiKey: true,
    status: 'bootstrapping',
    errorMessage: null,
  }
}

export const ApiKeyProvider = ({
  children,
  storage = defaultStorage,
  validator = geminiApiKeyValidator,
}: ApiKeyProviderProps) => {
  const [session, setSession] = useState<ApiKeySession>(
    () => createInitialSession(storage),
  )
  const validationIdRef = useRef(0)

  const finishValidationFailure = useCallback(
    (
      apiKey: string,
      error: unknown,
      rememberApiKey: boolean,
    ) => {
      const isAuthenticationError = validator.isAuthenticationError(error)

      if (isAuthenticationError) {
        storage.clear()
      }

      setSession({
        apiKey,
        rememberApiKey,
        status: 'invalid',
        errorMessage: isAuthenticationError
          ? validator.getAuthenticationErrorMessage(error)
          : validator.getValidationErrorMessage(error),
      })
    },
    [storage, validator],
  )

  const authenticate = useCallback(
    async (
      key: string,
      options: AuthenticateApiKeyOptions = {},
    ) => {
      const apiKey = key.trim()
      const rememberApiKey = options.remember ?? true

      if (!apiKey) {
        return false
      }

      const validationId = validationIdRef.current + 1
      validationIdRef.current = validationId

      setSession({
        apiKey,
        rememberApiKey,
        status: 'authenticating',
        errorMessage: null,
      })

      try {
        await validator.validate(apiKey)

        if (validationIdRef.current !== validationId) {
          return false
        }

        if (rememberApiKey) {
          storage.save(apiKey)
        } else {
          storage.clear()
        }

        setSession({
          apiKey,
          rememberApiKey,
          status: 'authenticated',
          errorMessage: null,
        })

        return true
      } catch (error) {
        if (validationIdRef.current !== validationId) {
          return false
        }

        finishValidationFailure(apiKey, error, rememberApiKey)
        return false
      }
    },
    [finishValidationFailure, storage, validator],
  )

  const handleAuthError = useCallback((error: unknown) => {
    if (!validator.isAuthenticationError(error)) {
      return false
    }

    validationIdRef.current += 1
    storage.clear()
    setSession((currentSession) => ({
      apiKey: currentSession.apiKey,
      rememberApiKey: currentSession.rememberApiKey,
      status: 'invalid',
      errorMessage: validator.getAuthenticationErrorMessage(error),
    }))

    return true
  }, [storage, validator])

  const logout = useCallback(() => {
    validationIdRef.current += 1
    storage.clear()
    setSession(createMissingSession())
  }, [storage])

  useEffect(() => {
    if (session.status !== 'bootstrapping' || !session.apiKey) {
      return
    }

    const apiKey = session.apiKey
    const validationId = validationIdRef.current + 1
    validationIdRef.current = validationId

    void (async () => {
      try {
        await validator.validate(apiKey)

        if (validationIdRef.current !== validationId) {
          return
        }

        storage.save(apiKey)
        setSession({
          apiKey,
          rememberApiKey: true,
          status: 'authenticated',
          errorMessage: null,
        })
      } catch (error) {
        if (validationIdRef.current !== validationId) {
          return
        }

        finishValidationFailure(apiKey, error, true)
      }
    })()
  }, [
    finishValidationFailure,
    session.apiKey,
    session.status,
    storage,
    validator,
  ])

  const value = useMemo<ApiKeyContextValue>(
    () => ({
      apiKey: session.apiKey,
      rememberApiKey: session.rememberApiKey,
      status: session.status,
      errorMessage: session.errorMessage,
      authenticate,
      handleAuthError,
      logout,
    }),
    [
      authenticate,
      handleAuthError,
      logout,
      session.apiKey,
      session.errorMessage,
      session.rememberApiKey,
      session.status,
    ],
  )

  return (
    <ApiKeyContext.Provider value={value}>
      {children}
    </ApiKeyContext.Provider>
  )
}
