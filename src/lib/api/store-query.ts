import type { GoogleGenAI } from '@google/genai'
import { buildStoreQueryRequest } from '@/lib/store-query/request'
import type {
  StoreQueryRequest,
  StoreQueryResponse,
} from '@/lib/store-query/types'
import { getStoreQuerySources } from '@/lib/store-query/sources'

type QueryResponse = Awaited<ReturnType<GoogleGenAI['models']['generateContent']>>

const getAnswerMarkdown = (text?: string): string => {
  const answer = text?.trim()
  return answer ? answer : 'No answer returned.'
}

const getQueryCandidate = (response: QueryResponse) => response.candidates?.[0]

const toStoreQueryResponse = (response: QueryResponse): StoreQueryResponse => {
  const candidate = getQueryCandidate(response)

  return {
    answerMarkdown: getAnswerMarkdown(response.text),
    sources: getStoreQuerySources(candidate),
    finishReason: candidate?.finishReason,
  }
}

export const queryStore = async (
  client: GoogleGenAI,
  request: StoreQueryRequest,
): Promise<StoreQueryResponse> => {
  const response = await client.models.generateContent(buildStoreQueryRequest(request))
  return toStoreQueryResponse(response)
}
