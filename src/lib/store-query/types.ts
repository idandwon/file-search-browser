import type { Content } from '@google/genai'
import type { StoreQueryModel } from './config'

export type StoreQueryRequest = {
  readonly model: StoreQueryModel
  readonly storeId: string
  readonly prompt: string
  readonly contents: readonly Content[]
  readonly signal?: AbortSignal
}

export type StoreQuerySource = {
  readonly id: string
  readonly title: string
  readonly snippet: string
  readonly storeName?: string
  readonly uri?: string
}

export type StoreQueryResponse = {
  readonly answerMarkdown: string
  readonly sources: readonly StoreQuerySource[]
  readonly finishReason?: string
}

export type StoreQueryRunResult =
  | {
      readonly status: 'success'
      readonly response: StoreQueryResponse
    }
  | {
      readonly status: 'cancelled'
    }
  | {
      readonly status: 'failure'
      readonly error: Error
    }

export type StoreQueryMessageRole = 'assistant' | 'user'

export type StoreQueryMessageStatus = 'complete' | 'error' | 'pending'

export type StoreQueryMessage = {
  readonly id: string
  readonly role: StoreQueryMessageRole
  readonly status: StoreQueryMessageStatus
  readonly question: string
  readonly content: string
  readonly createdAt: string
  readonly error?: string
  readonly sources: readonly StoreQuerySource[]
}
