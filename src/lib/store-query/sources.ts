import type { Candidate, GroundingChunk } from '@google/genai'
import type { StoreQuerySource } from './types'

const getSnippet = (chunk: GroundingChunk): string => {
  if (chunk.retrievedContext?.text) return chunk.retrievedContext.text
  if (chunk.web?.uri) return chunk.web.uri
  if (chunk.image?.sourceUri) return chunk.image.sourceUri
  return ''
}

const getTitle = (chunk: GroundingChunk, index: number): string => {
  if (chunk.retrievedContext?.title) return chunk.retrievedContext.title
  if (chunk.web?.title) return chunk.web.title
  if (chunk.image?.title) return chunk.image.title
  return `Source ${index + 1}`
}

const getStoreName = (chunk: GroundingChunk): string | undefined =>
  chunk.retrievedContext?.documentName

const getUri = (chunk: GroundingChunk): string | undefined =>
  chunk.retrievedContext?.uri ?? chunk.web?.uri ?? chunk.image?.sourceUri

const toSource = (chunk: GroundingChunk, index: number): StoreQuerySource => ({
  id: `${getTitle(chunk, index)}-${index}`,
  title: getTitle(chunk, index),
  snippet: getSnippet(chunk),
  storeName: getStoreName(chunk),
  uri: getUri(chunk),
})

const toSourceKey = (source: StoreQuerySource): string =>
  [source.title, source.snippet, source.uri].join('::')

export const getStoreQuerySources = (
  candidate?: Candidate,
): readonly StoreQuerySource[] => {
  const chunks = candidate?.groundingMetadata?.groundingChunks ?? []
  const sources = chunks.map(toSource)
  const seen = new Set<string>()

  return sources.filter((source) => {
    const key = toSourceKey(source)

    if (seen.has(key)) {
      return false
    }

    seen.add(key)
    return true
  })
}
