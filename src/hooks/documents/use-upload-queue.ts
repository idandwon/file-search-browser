import { useCallback, useReducer } from 'react'
import {
  normalizeBaseName,
  splitFileName,
  validateDisplayName,
  type UploadDisplayNameParts,
  type UploadDisplayNamePolicy,
} from '@/lib/documents/upload/upload-display-name'

export type UploadQueueItemStatus = 'queued' | 'uploading' | 'done' | 'failed'

export type UploadQueueItem = UploadDisplayNameParts & {
  readonly id: string
  readonly file: File
  readonly status: UploadQueueItemStatus
  readonly validationError?: string
  readonly uploadError?: string
}

type UploadQueueState = {
  readonly items: readonly UploadQueueItem[]
}

type UploadQueueAction =
  | {
      readonly type: 'enqueue'
      readonly files: readonly File[]
    }
  | {
      readonly type: 'edit-base-name'
      readonly id: string
      readonly baseName: string
    }
  | {
      readonly type: 'remove'
      readonly id: string
    }
  | {
      readonly type: 'mark-uploading'
      readonly id: string
    }
  | {
      readonly type: 'mark-done'
      readonly id: string
    }
  | {
      readonly type: 'mark-failed'
      readonly id: string
      readonly error: string
    }
  | {
      readonly type: 'reset'
    }

const initialState: UploadQueueState = { items: [] }

let uploadQueueItemIdCounter = 0
const nextUploadQueueItemId = () => `upload-item-${++uploadQueueItemIdCounter}`

const withValidation = (
  item: Omit<UploadQueueItem, 'validationError'> & {
    readonly validationError?: string
  },
  policy: UploadDisplayNamePolicy,
): UploadQueueItem => {
  const nextItem = { ...item, validationError: undefined }
  const validation = validateDisplayName(
    { baseName: nextItem.baseName, extension: nextItem.extension },
    policy,
  )

  return validation.ok
    ? nextItem
    : {
        ...nextItem,
        validationError: validation.message,
      }
}

const createUploadQueueItem = (
  file: File,
  policy: UploadDisplayNamePolicy,
): UploadQueueItem => {
  const { baseName, extension } = splitFileName(file.name)

  return withValidation(
    {
      id: nextUploadQueueItemId(),
      file,
      baseName: normalizeBaseName(baseName),
      extension,
      status: 'queued',
    },
    policy,
  )
}

const createUploadQueueReducer =
  (policy: UploadDisplayNamePolicy) =>
  (
    state: UploadQueueState,
    action: UploadQueueAction,
  ): UploadQueueState => {
    switch (action.type) {
      case 'enqueue':
        return {
          items: [
            ...state.items,
            ...action.files.map((file) => createUploadQueueItem(file, policy)),
          ],
        }

      case 'edit-base-name':
        return {
          items: state.items.map((item) => {
            if (item.id !== action.id) return item
            if (item.status === 'uploading' || item.status === 'done') return item

            return withValidation(
              {
                ...item,
                baseName: normalizeBaseName(action.baseName),
                status: 'queued',
                uploadError: undefined,
              },
              policy,
            )
          }),
        }

      case 'remove':
        return { items: state.items.filter((item) => item.id !== action.id) }

      case 'mark-uploading':
        return {
          items: state.items.map((item) =>
            item.id === action.id
              ? {
                  ...item,
                  status: 'uploading',
                  uploadError: undefined,
                }
              : item,
          ),
        }

      case 'mark-done':
        return {
          items: state.items.map((item) =>
            item.id === action.id
              ? {
                  ...item,
                  status: 'done',
                  uploadError: undefined,
                }
              : item,
          ),
        }

      case 'mark-failed':
        return {
          items: state.items.map((item) =>
            item.id === action.id
              ? {
                  ...item,
                  status: 'failed',
                  uploadError: action.error,
                }
              : item,
          ),
        }

      case 'reset':
        return initialState

      default:
        return state
    }
  }

export const useUploadQueue = (policy: UploadDisplayNamePolicy) => {
  const [state, dispatch] = useReducer(
    createUploadQueueReducer(policy),
    initialState,
  )

  const addFiles = useCallback((files: readonly File[]) => {
    if (files.length === 0) return

    dispatch({ type: 'enqueue', files })
  }, [])

  const updateBaseName = useCallback((id: string, baseName: string) => {
    dispatch({ type: 'edit-base-name', id, baseName })
  }, [])

  const removeFile = useCallback((id: string) => {
    dispatch({ type: 'remove', id })
  }, [])

  const markUploading = useCallback((id: string) => {
    dispatch({ type: 'mark-uploading', id })
  }, [])

  const markDone = useCallback((id: string) => {
    dispatch({ type: 'mark-done', id })
  }, [])

  const markFailed = useCallback((id: string, error: string) => {
    dispatch({ type: 'mark-failed', id, error })
  }, [])

  const reset = useCallback(() => {
    dispatch({ type: 'reset' })
  }, [])

  const items = state.items
  const uploadableItems = items.filter(
    (item) =>
      (item.status === 'queued' || item.status === 'failed') &&
      !item.validationError,
  )
  const uploadableCount = uploadableItems.length
  const allDone = items.length > 0 && items.every((item) => item.status === 'done')

  return {
    items,
    uploadableItems,
    uploadableCount,
    allDone,
    addFiles,
    updateBaseName,
    removeFile,
    markUploading,
    markDone,
    markFailed,
    reset,
  }
}
