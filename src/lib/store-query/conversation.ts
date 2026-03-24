import type { Content } from '@google/genai'
import { normalizeStoreQueryQuestion } from './question'
import type { StoreQueryMessage } from './types'

const createTextContent = (
  role: 'model' | 'user',
  text: string,
): Content => ({
  role,
  parts: [{ text }],
})

const isCompleteMessage = (message: StoreQueryMessage): boolean =>
  message.status === 'complete'

const isUserMessage = (message: StoreQueryMessage): boolean =>
  message.role === 'user'

const isAssistantMessage = (message: StoreQueryMessage): boolean =>
  message.role === 'assistant'

const toUserContent = (message: StoreQueryMessage): Content =>
  createTextContent('user', message.question)

const toAssistantContent = (message: StoreQueryMessage): Content =>
  createTextContent('model', message.content)

export const buildStoreQueryConversationContents = ({
  messages,
  question,
}: {
  readonly messages: readonly StoreQueryMessage[]
  readonly question: string
}): Content[] => {
  const contents: Content[] = []
  let pendingUserMessage: StoreQueryMessage | null = null

  for (const message of messages) {
    if (!isCompleteMessage(message)) {
      pendingUserMessage = null
      continue
    }

    if (isUserMessage(message)) {
      pendingUserMessage = message
      continue
    }

    if (!isAssistantMessage(message) || !pendingUserMessage) {
      pendingUserMessage = null
      continue
    }

    contents.push(toUserContent(pendingUserMessage), toAssistantContent(message))
    pendingUserMessage = null
  }

  const nextQuestion = normalizeStoreQueryQuestion(question)

  if (!nextQuestion) {
    return contents
  }

  return [...contents, createTextContent('user', nextQuestion)]
}
