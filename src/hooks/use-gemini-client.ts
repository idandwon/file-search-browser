import { useContext } from 'react'
import { GeminiContext } from '@/providers/gemini-context'
import type { GoogleGenAI } from '@google/genai'

export const useGeminiClient = (): GoogleGenAI => {
  const client = useContext(GeminiContext)

  if (!client) {
    throw new Error('useGeminiClient must be used within a GeminiProvider with a valid API key')
  }

  return client
}
