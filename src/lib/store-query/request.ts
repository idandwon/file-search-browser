import type { GenerateContentParameters } from '@google/genai'
import { toFileSearchStoreResourceName } from '@/lib/api/file-search-resource'
import type { StoreQueryRequest } from './types'
import {
  isStoreQueryModel,
  type StoreQueryModel,
} from './config'

const getModel = (model: StoreQueryModel): StoreQueryModel => {
  if (!isStoreQueryModel(model)) {
    throw new Error('Store query model is not supported for file search.')
  }

  return model
}

const getContents = (contents: StoreQueryRequest['contents']) => {
  if (contents.length === 0) {
    throw new Error('Store query requires conversation contents.')
  }

  return [...contents]
}

export const buildStoreQueryRequest = ({
  contents,
  model,
  prompt,
  signal,
  storeId,
}: StoreQueryRequest): GenerateContentParameters => {
  const fileSearchStoreName = toFileSearchStoreResourceName(storeId)

  return {
    model: getModel(model),
    contents: getContents(contents),
    config: {
      abortSignal: signal,
      systemInstruction: prompt,
      tools: [
        {
          fileSearch: {
            fileSearchStoreNames: [fileSearchStoreName],
          },
        },
      ],
    },
  }
}
