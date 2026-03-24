import { createContext } from 'react'

export type StoreQueryDialogLifecycleValue = {
  readonly isOpen: boolean
  readonly onOpenChange: (isOpen: boolean) => void
  readonly open: () => void
  readonly requestClose: () => void
}

export const StoreQueryDialogLifecycleContext =
  createContext<StoreQueryDialogLifecycleValue | null>(null)
