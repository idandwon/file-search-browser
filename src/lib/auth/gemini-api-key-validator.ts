import { ApiError, GoogleGenAI } from '@google/genai'
import type { CredentialValidator } from './types'

const AUTH_ERROR_STATUSES = new Set([401, 403])

export const createGeminiClient = (apiKey: string): GoogleGenAI =>
  new GoogleGenAI({ apiKey })

export const isGeminiAuthenticationError = (error: unknown): error is ApiError =>
  error instanceof ApiError && AUTH_ERROR_STATUSES.has(error.status)

export const getGeminiAuthenticationErrorMessage = (error: unknown): string => {
  if (error instanceof ApiError && error.status === 401) {
    return 'Invalid API key. Please check your key and try again.'
  }

  if (error instanceof ApiError && error.status === 403) {
    return 'This API key does not have access to file search stores.'
  }

  return 'We could not verify your API key. Please try again.'
}

const getGeminiValidationErrorMessage = (): string =>
  'We could not verify your API key right now. Please try again.'

export const geminiApiKeyValidator: CredentialValidator<string> = {
  validate: async (apiKey) => {
    const client = createGeminiClient(apiKey)

    await client.fileSearchStores.list({
      config: { pageSize: 1 },
    })
  },
  isAuthenticationError: isGeminiAuthenticationError,
  getAuthenticationErrorMessage: getGeminiAuthenticationErrorMessage,
  getValidationErrorMessage: getGeminiValidationErrorMessage,
}
