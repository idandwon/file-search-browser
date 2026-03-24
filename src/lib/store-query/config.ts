export const STORE_QUERY_MODEL_OPTIONS = [
  {
    value: 'gemini-3.1-pro-preview',
    label: 'Gemini 3.1 Pro Preview',
    description: 'Advanced Gemini 3.1 reasoning model with file search support in AI Studio.',
  },
  {
    value: 'gemini-3-flash-preview',
    label: 'Gemini 3 Flash Preview',
    description: 'Preview Gemini 3 Flash model with file search support.',
  },
  {
    value: 'gemini-3.1-flash-lite-preview',
    label: 'Gemini 3.1 Flash-Lite Preview',
    description: 'Fast, lower-cost Gemini 3.1 model with file search support.',
  },
  {
    value: 'gemini-2.5-flash',
    label: 'Gemini 2.5 Flash',
    description: 'Balanced latency and answer quality for most file search queries.',
  },
  {
    value: 'gemini-2.5-flash-lite',
    label: 'Gemini 2.5 Flash Lite',
    description: 'Faster and lighter-weight for simpler retrieval-driven questions.',
  },
  {
    value: 'gemini-2.5-pro',
    label: 'Gemini 2.5 Pro',
    description: 'Best reasoning depth, with higher latency than the Flash models.',
  },
] as const

export type StoreQueryModel = (typeof STORE_QUERY_MODEL_OPTIONS)[number]['value']

export const STORE_QUERY_DEFAULT_PROMPT =
  'Answer using only information retrieved from this store. If the retrieved content is insufficient, say that clearly. Be concise. Use markdown. Do not invent facts or sources.'

export const STORE_QUERY_DEFAULT_MODEL: StoreQueryModel = 'gemini-2.5-flash'
export const STORE_QUERY_POLL_INTERVAL_MS = 5000

const storeQueryModels = new Set<string>(
  STORE_QUERY_MODEL_OPTIONS.map(({ value }) => value),
)

export const isStoreQueryModel = (value: string): value is StoreQueryModel =>
  storeQueryModels.has(value)

export const getStoreQueryModelLabel = (model: StoreQueryModel): string =>
  STORE_QUERY_MODEL_OPTIONS.find((option) => option.value === model)?.label ??
  model
