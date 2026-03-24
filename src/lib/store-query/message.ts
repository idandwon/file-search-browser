import type { StoreQueryMessage, StoreQueryResponse } from './types'

const createMessageId = () => crypto.randomUUID()

const getTimestamp = () => new Date().toISOString()

export const createStoreQueryExchange = (
  question: string,
): {
  readonly userMessage: StoreQueryMessage
  readonly assistantMessage: StoreQueryMessage
} => {
  const createdAt = getTimestamp()

  return {
    userMessage: {
      id: createMessageId(),
      role: 'user',
      status: 'complete',
      question,
      content: question,
      createdAt,
      sources: [],
    },
    assistantMessage: {
      id: createMessageId(),
      role: 'assistant',
      status: 'pending',
      question,
      content: '',
      createdAt,
      sources: [],
    },
  }
}

export const createCancelledStoreQueryError = (): Error =>
  new Error('Query cancelled.')

export const completeAssistantMessage = (
  message: StoreQueryMessage,
  response: StoreQueryResponse,
): StoreQueryMessage => ({
  ...message,
  status: 'complete',
  content: response.answerMarkdown,
  error: undefined,
  sources: response.sources,
})

export const failAssistantMessage = (
  message: StoreQueryMessage,
  error: Error,
): StoreQueryMessage => ({
  ...message,
  status: 'error',
  content: '',
  error: error.message,
  sources: [],
})

export const replaceStoreQueryMessage = (
  messages: readonly StoreQueryMessage[],
  nextMessage: StoreQueryMessage,
): readonly StoreQueryMessage[] =>
  messages.map((message) =>
    message.id === nextMessage.id ? nextMessage : message,
  )
