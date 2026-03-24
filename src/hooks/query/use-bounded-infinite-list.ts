import { useMemo } from "react";
import {
  type InfiniteData,
  type QueryKey,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { LIST_GC_TIME_MS, MAX_LIST_PAGES } from "@/lib/query/policy";

type PageWithToken = {
  readonly nextPageToken?: string;
};

type FetchPageParams = {
  readonly pageToken?: string;
  readonly signal: AbortSignal;
};

type UseBoundedInfiniteListOptions<
  TPage extends PageWithToken,
  TItem,
  TQueryKey extends QueryKey,
> = {
  readonly queryKey: TQueryKey;
  readonly enabled?: boolean;
  readonly retainFetchedPages?: boolean;
  readonly fetchPage: (params: FetchPageParams) => Promise<TPage>;
  readonly getItems: (page: TPage) => readonly TItem[] | undefined;
};

export const useBoundedInfiniteList = <
  TPage extends PageWithToken,
  TItem,
  TQueryKey extends QueryKey,
>({
  queryKey,
  enabled = true,
  retainFetchedPages = false,
  fetchPage,
  getItems,
}: UseBoundedInfiniteListOptions<TPage, TItem, TQueryKey>) => {
  const query = useInfiniteQuery<
    TPage,
    Error,
    InfiniteData<TPage>,
    TQueryKey,
    string | undefined
  >({
    queryKey,
    queryFn: ({ pageParam, signal }) =>
      fetchPage({ pageToken: pageParam, signal }),
    enabled,
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.nextPageToken ?? undefined,
    gcTime: LIST_GC_TIME_MS,
    maxPages: retainFetchedPages ? undefined : MAX_LIST_PAGES,
  });

  const items = useMemo(
    () => query.data?.pages.flatMap((page) => getItems(page) ?? []) ?? [],
    [getItems, query.data],
  );

  const nextCursor = query.data?.pages.at(-1)?.nextPageToken;
  const loadedPageCount = query.data?.pages.length ?? 0;

  return {
    ...query,
    items,
    nextCursor,
    loadedPageCount,
  } as const;
};
