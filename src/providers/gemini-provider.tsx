import { useMemo, type ReactNode } from 'react'
import { useApiKey } from '@/hooks/use-api-key'
import { GeminiContext } from './gemini-context'
import { createGeminiClient } from '@/lib/auth/gemini-api-key-validator'

export const GeminiProvider = ({ children }: { readonly children: ReactNode }) => {
  const { apiKey, status } = useApiKey()

  const client = useMemo(
    () => (status === 'authenticated' && apiKey ? createGeminiClient(apiKey) : null),
    [apiKey, status],
  )

  return (
    <GeminiContext.Provider value={client}>
      {children}
    </GeminiContext.Provider>
  )
}
