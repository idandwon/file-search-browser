import { createContext } from 'react'
import type { GoogleGenAI } from '@google/genai'

export const GeminiContext = createContext<GoogleGenAI | null>(null)
