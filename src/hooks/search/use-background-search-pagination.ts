import { useCallback, useEffect, useReducer, useRef } from 'react'
import type { InfiniteData } from '@tanstack/react-query'

type PageWithToken = {
  readonly nextPageToken?: string
}

type FetchNextPageResult<TPage> = {
  readonly data?: InfiniteData<TPage>
  readonly dataUpdatedAt?: number
  readonly hasNextPage?: boolean
}

type SearchPaginationState = 'idle' | 'running' | 'exhausted' | 'error'

type SearchPaginationSnapshot = {
  readonly scopeKey: string
  readonly state: SearchPaginationState
  readonly dataUpdatedAt: number
  readonly pageCount: number
  readonly cursor?: string
}

type SearchPaginationSnapshotData = {
  readonly dataUpdatedAt: number
  readonly pageCount: number
  readonly cursor?: string
}

type SearchPaginationRun = {
  readonly id: number
  readonly scopeKey: string
}

type SearchPaginationControllerState = {
  readonly activeRun: SearchPaginationRun | null
  readonly settledSnapshot: SearchPaginationSnapshot
}

type SearchPaginationAction =
  | {
      readonly type: 'start-run'
      readonly run: SearchPaginationRun
    }
  | {
      readonly type: 'settle-run'
      readonly snapshot: SearchPaginationSnapshot
    }

type SearchFetchOutcome =
  | {
      readonly type: 'continue'
    }
  | {
      readonly type: 'settle'
      readonly nextState: Exclude<SearchPaginationState, 'running' | 'error'>
      readonly snapshot: SearchPaginationSnapshotData
    }

type SearchPaginationRuntimeOptions<TPage extends PageWithToken> = {
  readonly isSearchActive: boolean
  readonly runScopeKey: string
  readonly hasMorePages: boolean
  readonly isFetchingNextPage: boolean
  readonly loadedPageCount: number
  readonly nextCursor?: string
  readonly dataUpdatedAt: number
  readonly query: string
  readonly fetchNextPage: () => Promise<FetchNextPageResult<TPage>>
  readonly pageContainsMatch: (page: TPage, query: string) => boolean
}

type SettleSearchRunOptions = {
  readonly runId?: number
  readonly scopeKey?: string
  readonly nextState?: SearchPaginationState
  readonly snapshot?: SearchPaginationSnapshotData
}

type UseBackgroundSearchPaginationOptions<TPage extends PageWithToken> = {
  readonly isSearchActive: boolean
  readonly runScopeKey: string
  readonly hasLoadedMatch: boolean
  readonly hasNextPage: boolean | undefined
  readonly isFetchingNextPage: boolean
  readonly loadedPageCount: number
  readonly nextCursor?: string
  readonly dataUpdatedAt: number
  readonly query: string
  readonly fetchNextPage: () => Promise<FetchNextPageResult<TPage>>
  readonly pageContainsMatch: (page: TPage, query: string) => boolean
}

type SearchPaginationStatus = {
  readonly runState: SearchPaginationState
  readonly isRunning: boolean
  readonly isLoading: boolean
  readonly canAutoLoadMore: boolean
  readonly canManualLoadMore: boolean
}

const createSnapshot = ({
  scopeKey,
  state,
  dataUpdatedAt,
  pageCount,
  cursor,
}: SearchPaginationSnapshot): SearchPaginationSnapshot => ({
  scopeKey,
  state,
  dataUpdatedAt,
  pageCount,
  cursor,
})

const createSnapshotData = ({
  dataUpdatedAt,
  pageCount,
  cursor,
}: SearchPaginationSnapshotData): SearchPaginationSnapshotData => ({
  dataUpdatedAt,
  pageCount,
  cursor,
})

const createControllerState = ({
  runScopeKey,
  dataUpdatedAt,
  loadedPageCount,
  nextCursor,
}: Pick<
  SearchPaginationRuntimeOptions<PageWithToken>,
  'runScopeKey' | 'dataUpdatedAt' | 'loadedPageCount' | 'nextCursor'
>): SearchPaginationControllerState => ({
  activeRun: null,
  settledSnapshot: createSnapshot({
    scopeKey: runScopeKey,
    state: 'idle',
    dataUpdatedAt,
    pageCount: loadedPageCount,
    cursor: nextCursor,
  }),
})

const searchPaginationReducer = (
  state: SearchPaginationControllerState,
  action: SearchPaginationAction,
): SearchPaginationControllerState => {
  switch (action.type) {
    case 'start-run':
      return {
        ...state,
        activeRun: action.run,
      }

    case 'settle-run':
      return {
        activeRun: null,
        settledSnapshot: action.snapshot,
      }

    default:
      return state
  }
}

const isSameRun = (
  run: SearchPaginationRun | null,
  runId: number,
  scopeKey: string,
) => run?.id === runId && run.scopeKey === scopeKey

const isSnapshotCurrent = (
  snapshot: SearchPaginationSnapshot,
  options: Pick<
    SearchPaginationRuntimeOptions<PageWithToken>,
    'runScopeKey' | 'dataUpdatedAt' | 'loadedPageCount' | 'nextCursor'
  >,
) =>
  snapshot.scopeKey === options.runScopeKey &&
  snapshot.dataUpdatedAt === options.dataUpdatedAt &&
  snapshot.pageCount === options.loadedPageCount &&
  snapshot.cursor === options.nextCursor

const getSettledRunState = (
  snapshot: SearchPaginationSnapshot,
  options: Pick<
    SearchPaginationRuntimeOptions<PageWithToken>,
    'runScopeKey' | 'dataUpdatedAt' | 'loadedPageCount' | 'nextCursor'
  >,
): SearchPaginationState => (
  isSnapshotCurrent(snapshot, options)
    ? snapshot.state
    : 'idle'
)

const canStartRun = ({
  isSearchActive,
  hasMorePages,
  isFetchingNextPage,
  runScopeKey,
  activeRun,
}: Pick<
  SearchPaginationRuntimeOptions<PageWithToken>,
  'isSearchActive' | 'hasMorePages' | 'isFetchingNextPage' | 'runScopeKey'
> & {
  readonly activeRun: SearchPaginationRun | null
}) => {
  if (!isSearchActive) {
    return false
  }

  if (!hasMorePages) {
    return false
  }

  if (isFetchingNextPage) {
    return false
  }

  if (activeRun?.scopeKey === runScopeKey) {
    return false
  }

  return true
}

const canContinueRun = (
  options: Pick<
    SearchPaginationRuntimeOptions<PageWithToken>,
    'isSearchActive' | 'runScopeKey' | 'hasMorePages' | 'isFetchingNextPage'
  >,
  scopeKey: string,
) => {
  if (!options.isSearchActive) {
    return false
  }

  if (options.runScopeKey !== scopeKey) {
    return false
  }

  if (!options.hasMorePages) {
    return false
  }

  if (options.isFetchingNextPage) {
    return false
  }

  return true
}

const shouldSettleRun = (
  options: Pick<
    SearchPaginationRuntimeOptions<PageWithToken>,
    'isSearchActive' | 'runScopeKey' | 'hasMorePages'
  >,
  scopeKey: string,
) => {
  if (!options.isSearchActive) {
    return true
  }

  if (options.runScopeKey !== scopeKey) {
    return true
  }

  if (!options.hasMorePages) {
    return true
  }

  return false
}

const shouldAutoStartRun = ({
  isSearchActive,
  hasLoadedMatch,
  hasMorePages,
  isFetchingNextPage,
  isRunning,
  runState,
}: {
  readonly isSearchActive: boolean
  readonly hasLoadedMatch: boolean
  readonly hasMorePages: boolean
  readonly isFetchingNextPage: boolean
  readonly isRunning: boolean
  readonly runState: SearchPaginationState
}) => {
  if (!isSearchActive) {
    return false
  }

  if (hasLoadedMatch) {
    return false
  }

  if (!hasMorePages) {
    return false
  }

  if (isFetchingNextPage) {
    return false
  }

  if (isRunning) {
    return false
  }

  if (runState === 'exhausted') {
    return false
  }

  return true
}

const getSearchPaginationStatus = ({
  activeRun,
  settledSnapshot,
  isSearchActive,
  runScopeKey,
  dataUpdatedAt,
  loadedPageCount,
  nextCursor,
  hasMorePages,
  isFetchingNextPage,
}: SearchPaginationControllerState &
  Pick<
    SearchPaginationRuntimeOptions<PageWithToken>,
    | 'isSearchActive'
    | 'runScopeKey'
    | 'dataUpdatedAt'
    | 'loadedPageCount'
    | 'nextCursor'
    | 'hasMorePages'
    | 'isFetchingNextPage'
  >): SearchPaginationStatus => {
  const isRunning = activeRun?.scopeKey === runScopeKey
  const runState = isRunning
    ? 'running'
    : getSettledRunState(settledSnapshot, {
        runScopeKey,
        dataUpdatedAt,
        loadedPageCount,
        nextCursor,
      })
  const isLoading = isSearchActive && (isRunning || isFetchingNextPage)

  return {
    runState,
    isRunning,
    isLoading,
    canAutoLoadMore: !isSearchActive && !isRunning && hasMorePages,
    canManualLoadMore:
      isSearchActive &&
      !isLoading &&
      hasMorePages &&
      runState !== 'exhausted',
  }
}

const evaluateFetchResult = <TPage extends PageWithToken>({
  result,
  pageCountBeforeFetch,
  cursorBeforeFetch,
  dataUpdatedAt,
  query,
  pageContainsMatch,
}: {
  readonly result: FetchNextPageResult<TPage>
  readonly pageCountBeforeFetch: number
  readonly cursorBeforeFetch?: string
  readonly dataUpdatedAt: number
  readonly query: string
  readonly pageContainsMatch: (page: TPage, query: string) => boolean
}): SearchFetchOutcome => {
  const pages = result.data?.pages ?? []
  const latestPage = pages.at(-1)
  const pageCountAfterFetch = pages.length
  const cursorAfterFetch = latestPage?.nextPageToken
  const snapshot = createSnapshotData({
    dataUpdatedAt: result.dataUpdatedAt ?? dataUpdatedAt,
    pageCount: pageCountAfterFetch,
    cursor: cursorAfterFetch,
  })

  if (!latestPage || pageCountAfterFetch <= pageCountBeforeFetch) {
    return {
      type: 'settle',
      nextState: 'exhausted',
      snapshot,
    }
  }

  if (cursorBeforeFetch !== undefined && cursorBeforeFetch === cursorAfterFetch) {
    return {
      type: 'settle',
      nextState: 'exhausted',
      snapshot,
    }
  }

  const hasPageMatch = pageContainsMatch(latestPage, query)
  const hasMorePagesAfterFetch = cursorAfterFetch !== undefined

  if (hasPageMatch) {
    return {
      type: 'settle',
      nextState: hasMorePagesAfterFetch ? 'idle' : 'exhausted',
      snapshot,
    }
  }

  if (!hasMorePagesAfterFetch) {
    return {
      type: 'settle',
      nextState: 'exhausted',
      snapshot,
    }
  }

  return { type: 'continue' }
}

export const useBackgroundSearchPagination = <TPage extends PageWithToken>({
  isSearchActive,
  runScopeKey,
  hasLoadedMatch,
  hasNextPage,
  isFetchingNextPage,
  loadedPageCount,
  nextCursor,
  dataUpdatedAt,
  query,
  fetchNextPage,
  pageContainsMatch,
}: UseBackgroundSearchPaginationOptions<TPage>) => {
  const hasMorePages = Boolean(hasNextPage)
  const runtimeOptions: SearchPaginationRuntimeOptions<TPage> = {
    isSearchActive,
    runScopeKey,
    hasMorePages,
    isFetchingNextPage,
    loadedPageCount,
    nextCursor,
    dataUpdatedAt,
    query,
    fetchNextPage,
    pageContainsMatch,
  }
  const [state, dispatch] = useReducer(
    searchPaginationReducer,
    runtimeOptions,
    createControllerState,
  )
  const activeRunRef = useRef<SearchPaginationRun | null>(null)
  const inFlightRunRef = useRef<SearchPaginationRun | null>(null)
  const latestOptionsRef = useRef(runtimeOptions)
  const runIdRef = useRef(0)

  const settleRun = useCallback(({
    runId,
    scopeKey,
    nextState = 'idle',
    snapshot,
  }: SettleSearchRunOptions = {}) => {
    const currentRun = activeRunRef.current

    if (runId !== undefined && currentRun?.id !== runId) {
      return
    }

    const latestOptions = latestOptionsRef.current
    const nextSnapshot = createSnapshot({
      scopeKey: scopeKey ?? currentRun?.scopeKey ?? latestOptions.runScopeKey,
      state: nextState,
      dataUpdatedAt: snapshot?.dataUpdatedAt ?? latestOptions.dataUpdatedAt,
      pageCount: snapshot?.pageCount ?? latestOptions.loadedPageCount,
      cursor: snapshot?.cursor ?? latestOptions.nextCursor,
    })

    activeRunRef.current = null
    inFlightRunRef.current = null
    dispatch({
      type: 'settle-run',
      snapshot: nextSnapshot,
    })
  }, [])

  useEffect(() => {
    latestOptionsRef.current = {
      isSearchActive,
      runScopeKey,
      hasMorePages,
      isFetchingNextPage,
      loadedPageCount,
      nextCursor,
      dataUpdatedAt,
      query,
      fetchNextPage,
      pageContainsMatch,
    }
  }, [
    dataUpdatedAt,
    fetchNextPage,
    hasMorePages,
    isFetchingNextPage,
    isSearchActive,
    loadedPageCount,
    nextCursor,
    pageContainsMatch,
    query,
    runScopeKey,
  ])

  useEffect(() => {
    return () => {
      activeRunRef.current = null
      inFlightRunRef.current = null
    }
  }, [])

  const start = useCallback(() => {
    const latestOptions = latestOptionsRef.current
    const currentRun = activeRunRef.current

    if (!canStartRun({
      ...latestOptions,
      activeRun: currentRun,
    })) {
      return
    }

    const nextRun = {
      id: runIdRef.current + 1,
      scopeKey: latestOptions.runScopeKey,
    }

    runIdRef.current = nextRun.id
    activeRunRef.current = nextRun
    dispatch({
      type: 'start-run',
      run: nextRun,
    })
  }, [])

  const { runState, isRunning, isLoading, canAutoLoadMore, canManualLoadMore } =
    getSearchPaginationStatus({
      ...state,
      isSearchActive,
      runScopeKey,
      dataUpdatedAt,
      loadedPageCount,
      nextCursor,
      hasMorePages,
      isFetchingNextPage,
    })

  useEffect(() => {
    const activeRun = state.activeRun

    if (!activeRun) {
      return
    }

    if (!isSameRun(activeRunRef.current, activeRun.id, activeRun.scopeKey)) {
      return
    }

    if (isSameRun(inFlightRunRef.current, activeRun.id, activeRun.scopeKey)) {
      return
    }

    const latestOptions = latestOptionsRef.current

    if (shouldSettleRun(latestOptions, activeRun.scopeKey)) {
      settleRun({
        runId: activeRun.id,
        scopeKey: activeRun.scopeKey,
      })
      return
    }

    if (!canContinueRun(latestOptions, activeRun.scopeKey)) {
      return
    }

    const pageCountBeforeFetch = latestOptions.loadedPageCount
    const cursorBeforeFetch = latestOptions.nextCursor

    inFlightRunRef.current = activeRun

    void (async () => {
      let result: FetchNextPageResult<TPage>

      try {
        result = await latestOptions.fetchNextPage()
      } catch {
        if (!isSameRun(activeRunRef.current, activeRun.id, activeRun.scopeKey)) {
          return
        }

        settleRun({
          runId: activeRun.id,
          scopeKey: activeRun.scopeKey,
          nextState: 'error',
          snapshot: createSnapshotData({
            dataUpdatedAt: latestOptions.dataUpdatedAt,
            pageCount: pageCountBeforeFetch,
            cursor: cursorBeforeFetch,
          }),
        })
        return
      } finally {
        if (isSameRun(inFlightRunRef.current, activeRun.id, activeRun.scopeKey)) {
          inFlightRunRef.current = null
        }
      }

      if (!isSameRun(activeRunRef.current, activeRun.id, activeRun.scopeKey)) {
        return
      }

      const currentOptions = latestOptionsRef.current

      if (currentOptions.runScopeKey !== activeRun.scopeKey) {
        settleRun({
          runId: activeRun.id,
          scopeKey: activeRun.scopeKey,
        })
        return
      }

      const outcome = evaluateFetchResult({
        result,
        pageCountBeforeFetch,
        cursorBeforeFetch,
        dataUpdatedAt: currentOptions.dataUpdatedAt,
        query: currentOptions.query,
        pageContainsMatch: currentOptions.pageContainsMatch,
      })

      if (outcome.type === 'settle') {
        settleRun({
          runId: activeRun.id,
          scopeKey: activeRun.scopeKey,
          nextState: outcome.nextState,
          snapshot: outcome.snapshot,
        })
      }
    })()
  }, [
    dataUpdatedAt,
    hasMorePages,
    isFetchingNextPage,
    isSearchActive,
    loadedPageCount,
    nextCursor,
    query,
    runScopeKey,
    settleRun,
    state.activeRun,
  ])

  useEffect(() => {
    if (!shouldAutoStartRun({
      isSearchActive,
      hasLoadedMatch,
      hasMorePages,
      isFetchingNextPage,
      isRunning,
      runState,
    })) {
      return
    }

    start()
  }, [
    hasLoadedMatch,
    hasMorePages,
    isFetchingNextPage,
    isRunning,
    isSearchActive,
    runScopeKey,
    runState,
    start,
  ])

  return {
    runState,
    isRunning,
    isLoading,
    canAutoLoadMore,
    canManualLoadMore,
    start,
    stop: settleRun,
  } as const
}
