import { useContext } from 'react'
import { ApiKeyContext, type ApiKeyContextValue } from '@/providers/api-key-context'

export const useApiKey = (): ApiKeyContextValue => {
  const context = useContext(ApiKeyContext)

  if (!context) {
    throw new Error('useApiKey must be used within an ApiKeyProvider')
  }

  return context
}
