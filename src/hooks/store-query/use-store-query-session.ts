import { useCallback, useEffect, useReducer } from 'react'
import type { StoreQueryAvailability } from '@/lib/store-query/availability'
import type { StoreQueryModel } from '@/lib/store-query/config'
import { buildStoreQueryConversationContents } from '@/lib/store-query/conversation'
import {
  createCancelledStoreQueryError,
  createStoreQueryExchange,
} from '@/lib/store-query/message'
import { normalizeStoreQueryQuestion } from '@/lib/store-query/question'
import {
  canRunStoreQuery,
  createStoreQuerySessionState,
  hasStoreQueryActivity,
  storeQuerySessionReducer,
} from '@/lib/store-query/session-state'
import type { StoreQueryMessage } from '@/lib/store-query/types'
import { useDisclosure } from '@/hooks/use-disclosure'
import { useStoreQuery } from './use-store-query'
import { useStoreQueryReadiness } from './use-store-query-readiness'
import { useStoreQuerySettings } from './use-store-query-settings'

export type StoreQuerySessionStoreSlice = {
  readonly availability: StoreQueryAvailability
  readonly error: Error | null
  readonly isLoading: boolean
  readonly retry: () => void
}

export type StoreQuerySessionComposerSlice = {
  readonly canSubmit: boolean
  readonly draft: string
  readonly isPending: boolean
  readonly model: StoreQueryModel
  readonly setModel: (model: StoreQueryModel) => void
  readonly setDraft: (draft: string) => void
  readonly submit: () => void
}

export type StoreQuerySessionTranscriptSlice = {
  readonly clearConversation: () => void
  readonly hasActivity: boolean
  readonly messages: readonly StoreQueryMessage[]
  readonly retryMessage: (question: string) => void
}

export type StoreQuerySessionSettingsSlice = {
  readonly isOpen: boolean
  readonly onOpenChange: (isOpen: boolean) => void
  readonly open: () => void
  readonly prompt: string
  readonly setPrompt: (prompt: string) => void
}

export type StoreQuerySession = {
  readonly composer: StoreQuerySessionComposerSlice
  readonly settings: StoreQuerySessionSettingsSlice
  readonly store: StoreQuerySessionStoreSlice
  readonly transcript: StoreQuerySessionTranscriptSlice
}

export const useStoreQuerySession = ({
  isDialogOpen,
  storeId,
}: {
  readonly isDialogOpen: boolean
  readonly storeId: string
}): StoreQuerySession => {
  const {
    close: closeSettings,
    isOpen: isSettingsOpen,
    onOpenChange: onSettingsOpenChange,
    open: openSettings,
  } = useDisclosure()
  const { cancel, isPending, run } = useStoreQuery(storeId)
  const readiness = useStoreQueryReadiness(storeId)
  const { model, prompt, setModel, setPrompt } = useStoreQuerySettings(storeId)
  const [state, dispatch] = useReducer(
    storeQuerySessionReducer,
    undefined,
    createStoreQuerySessionState,
  )

  const setDraft = useCallback((draft: string) => {
    dispatch({ type: 'draft-set', draft })
  }, [])

  const executeQuestion = useCallback(
    async (question: string) => {
      const exchange = createStoreQueryExchange(question)

      dispatch({
        type: 'exchange-started',
        assistantMessage: exchange.assistantMessage,
        userMessage: exchange.userMessage,
      })

      const result = await run({
        contents: buildStoreQueryConversationContents({
          messages: state.messages,
          question,
        }),
        model,
        prompt,
      })

      if (result.status === 'success') {
        dispatch({
          type: 'exchange-completed',
          assistantMessageId: exchange.assistantMessage.id,
          response: result.response,
        })
        return
      }

      dispatch({
        type: 'exchange-failed',
        assistantMessageId: exchange.assistantMessage.id,
        error:
          result.status === 'cancelled'
            ? createCancelledStoreQueryError()
            : result.error,
      })
    },
    [model, prompt, run, state.messages],
  )

  const submit = useCallback(async () => {
    if (
      !canRunStoreQuery({
        canQuery: readiness.availability.canQuery,
        isPending,
        question: state.draft,
      })
    ) {
      return
    }

    const question = normalizeStoreQueryQuestion(state.draft)

    dispatch({ type: 'draft-set', draft: '' })
    await executeQuestion(question)
  }, [executeQuestion, isPending, readiness.availability.canQuery, state.draft])

  const retryMessage = useCallback(
    async (question: string) => {
      if (
        !canRunStoreQuery({
          canQuery: readiness.availability.canQuery,
          isPending,
          question,
        })
      ) {
        return
      }

      await executeQuestion(normalizeStoreQueryQuestion(question))
    },
    [executeQuestion, isPending, readiness.availability.canQuery],
  )

  const clearConversation = useCallback(() => {
    cancel()
    dispatch({ type: 'session-cleared' })
  }, [cancel])

  useEffect(() => {
    if (isDialogOpen) {
      return
    }

    cancel()
    closeSettings()
    dispatch({ type: 'session-cleared' })
  }, [cancel, closeSettings, isDialogOpen])

  useEffect(() => {
    cancel()
    closeSettings()
    dispatch({ type: 'session-cleared' })
  }, [cancel, closeSettings, storeId])

  return {
    composer: {
      canSubmit: canRunStoreQuery({
        canQuery: readiness.availability.canQuery,
        isPending,
        question: state.draft,
      }),
      draft: state.draft,
      isPending,
      model,
      setModel,
      setDraft,
      submit: () => {
        void submit()
      },
    },
    settings: {
      isOpen: isSettingsOpen,
      onOpenChange: onSettingsOpenChange,
      open: openSettings,
      prompt,
      setPrompt,
    },
    store: {
      availability: readiness.availability,
      error: readiness.error,
      isLoading: readiness.isLoading,
      retry: readiness.retry,
    },
    transcript: {
      clearConversation,
      hasActivity: hasStoreQueryActivity(state.messages),
      messages: state.messages,
      retryMessage: (question) => {
        void retryMessage(question)
      },
    },
  }
}
