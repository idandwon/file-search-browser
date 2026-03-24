import type { Content } from '@google/genai'
import { useCallback, useEffect, useRef, type RefObject } from 'react'
import { useMutation } from '@tanstack/react-query'
import { queryStore } from '@/lib/api/store-query'
import type { StoreQueryModel } from '@/lib/store-query/config'
import type { StoreQueryResponse, StoreQueryRunResult } from '@/lib/store-query/types'
import { useGeminiClient } from '@/hooks/use-gemini-client'

type StoreQueryInput = {
  readonly contents: readonly Content[]
  readonly model: StoreQueryModel
  readonly prompt: string
}

type StoreQueryMutationInput = StoreQueryInput & {
  readonly controller: AbortController
  readonly requestId: number
}

const toError = (error: unknown): Error =>
  error instanceof Error ? error : new Error('Query failed.')

const isAbortError = (error: unknown): boolean =>
  error instanceof Error && error.name === 'AbortError'

const createAbortController = (): AbortController => new AbortController()

const getNextRequestId = (requestIdRef: RefObject<number>) =>
  requestIdRef.current + 1

const abortActiveRequest = (abortRef: RefObject<AbortController | null>) =>
  abortRef.current?.abort()

const useAbortRef = () => useRef<AbortController | null>(null)

const useRequestIdRef = () => useRef(0)

const useQueryCleanup = (abortRef: RefObject<AbortController | null>) => {
  useEffect(() => () => abortActiveRequest(abortRef), [abortRef])
}

const syncActiveRequest = ({
  abortRef,
  controller,
  requestId,
  requestIdRef,
}: {
  readonly abortRef: RefObject<AbortController | null>
  readonly controller: AbortController
  readonly requestId: number
  readonly requestIdRef: RefObject<number>
}) => {
  abortActiveRequest(abortRef)
  abortRef.current = controller
  requestIdRef.current = requestId
}

const isStaleRequest = (
  requestId: number,
  requestIdRef: RefObject<number>,
) => requestId !== requestIdRef.current

const shouldIgnoreError = (
  error: unknown,
  requestId: number,
  requestIdRef: RefObject<number>,
) => isAbortError(error) || isStaleRequest(requestId, requestIdRef)

const createMutationInput = ({
  abortRef,
  contents,
  model,
  prompt,
  requestIdRef,
}: {
  readonly abortRef: RefObject<AbortController | null>
  readonly contents: readonly Content[]
  readonly model: StoreQueryModel
  readonly prompt: string
  readonly requestIdRef: RefObject<number>
}): StoreQueryMutationInput => {
  const controller = createAbortController()
  const requestId = getNextRequestId(requestIdRef)

  syncActiveRequest({ abortRef, controller, requestId, requestIdRef })
  return { contents, controller, model, prompt, requestId }
}

const useStoreQueryMutation = (storeId: string) => {
  const client = useGeminiClient()

  return useMutation({
    mutationFn: async ({
      controller,
      contents,
      model,
      prompt,
      requestId,
    }: StoreQueryMutationInput) => ({
      requestId,
      response: await queryStore(client, {
        contents,
        model,
        prompt,
        signal: controller.signal,
        storeId,
      }),
    }),
  })
}

const settleQuery = (
  requestIdRef: RefObject<number>,
  requestId: number,
  response: StoreQueryResponse,
) => {
  if (isStaleRequest(requestId, requestIdRef)) {
    return null
  }

  return response
}

const useRunStoreQuery = ({
  abortRef,
  mutation,
  requestIdRef,
  storeId,
}: {
  readonly abortRef: RefObject<AbortController | null>
  readonly mutation: ReturnType<typeof useStoreQueryMutation>
  readonly requestIdRef: RefObject<number>
  readonly storeId: string
}) =>
  useCallback(
    async ({ contents, model, prompt }: StoreQueryInput): Promise<StoreQueryRunResult> => {
      if (!storeId) {
        return {
          status: 'failure',
          error: new Error('Store query requires a store.'),
        }
      }

      if (contents.length === 0) {
        return {
          status: 'failure',
          error: new Error('Store query requires conversation contents.'),
        }
      }

      const input = createMutationInput({
        abortRef,
        contents,
        model,
        prompt,
        requestIdRef,
      })

      try {
        const settled = await mutation.mutateAsync(input)
        const response = settleQuery(requestIdRef, settled.requestId, settled.response)

        if (!response) {
          return { status: 'cancelled' }
        }

        return {
          status: 'success',
          response,
        }
      } catch (error) {
        if (shouldIgnoreError(error, input.requestId, requestIdRef)) {
          return { status: 'cancelled' }
        }

        return {
          status: 'failure',
          error: toError(error),
        }
      }
    },
    [abortRef, mutation, requestIdRef, storeId],
  )

export const useStoreQuery = (storeId: string) => {
  const mutation = useStoreQueryMutation(storeId)
  const abortRef = useAbortRef()
  const requestIdRef = useRequestIdRef()
  const run = useRunStoreQuery({
    abortRef,
    mutation,
    requestIdRef,
    storeId,
  })

  useQueryCleanup(abortRef)

  const cancel = useCallback(() => abortActiveRequest(abortRef), [abortRef])

  return { cancel, isPending: mutation.isPending, run } as const
}
