import { useSyncExternalStore } from 'react'

const getServerSnapshot = (): boolean => false

const getSnapshot = (query: string): boolean => {
  if (typeof window === 'undefined') {
    return false
  }

  return window.matchMedia(query).matches
}

const subscribe = (query: string, listener: () => void): (() => void) => {
  if (typeof window === 'undefined') {
    return () => undefined
  }

  const mediaQuery = window.matchMedia(query)

  mediaQuery.addEventListener('change', listener)

  return () => mediaQuery.removeEventListener('change', listener)
}

export const useMediaQuery = (query: string): boolean =>
  useSyncExternalStore(
    (listener) => subscribe(query, listener),
    () => getSnapshot(query),
    getServerSnapshot,
  )
