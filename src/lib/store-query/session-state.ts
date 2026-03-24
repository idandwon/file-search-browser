import { hasStoreQueryQuestion } from './question'
import {
  completeAssistantMessage,
  failAssistantMessage,
  replaceStoreQueryMessage,
} from './message'
import type { StoreQueryMessage, StoreQueryResponse } from './types'

export type StoreQuerySessionState = {
  readonly draft: string
  readonly messages: readonly StoreQueryMessage[]
}

export type StoreQuerySessionAction =
  | {
      readonly type: 'draft-set'
      readonly draft: string
    }
  | {
      readonly type: 'exchange-started'
      readonly userMessage: StoreQueryMessage
      readonly assistantMessage: StoreQueryMessage
    }
  | {
      readonly type: 'exchange-completed'
      readonly assistantMessageId: string
      readonly response: StoreQueryResponse
    }
  | {
      readonly type: 'exchange-failed'
      readonly assistantMessageId: string
      readonly error: Error
    }
  | {
      readonly type: 'session-cleared'
    }

export const createStoreQuerySessionState = (): StoreQuerySessionState => ({
  draft: '',
  messages: [],
})

export const canRunStoreQuery = ({
  canQuery,
  isPending,
  question,
}: {
  readonly canQuery: boolean
  readonly isPending: boolean
  readonly question: string
}): boolean => canQuery && !isPending && hasStoreQueryQuestion(question)

export const hasStoreQueryActivity = (
  messages: readonly StoreQueryMessage[],
): boolean => messages.length > 0

export const storeQuerySessionReducer = (
  state: StoreQuerySessionState,
  action: StoreQuerySessionAction,
): StoreQuerySessionState => {
  switch (action.type) {
    case 'draft-set':
      return {
        ...state,
        draft: action.draft,
      }
    case 'exchange-started':
      return {
        ...state,
        messages: [...state.messages, action.userMessage, action.assistantMessage],
      }
    case 'exchange-completed': {
      const message = state.messages.find(
        (item) => item.id === action.assistantMessageId,
      )

      if (!message) {
        return state
      }

      return {
        ...state,
        messages: replaceStoreQueryMessage(
          state.messages,
          completeAssistantMessage(message, action.response),
        ),
      }
    }
    case 'exchange-failed': {
      const message = state.messages.find(
        (item) => item.id === action.assistantMessageId,
      )

      if (!message) {
        return state
      }

      return {
        ...state,
        messages: replaceStoreQueryMessage(
          state.messages,
          failAssistantMessage(message, action.error),
        ),
      }
    }
    case 'session-cleared':
      return createStoreQuerySessionState()
  }
}
