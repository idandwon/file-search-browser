import {
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  StoreQueryDialogLifecycleContext,
  type StoreQueryDialogLifecycleValue,
} from './store-query-dialog-lifecycle-context'

type StoreQueryDialogLifecycleProviderProps = {
  readonly children: ReactNode
}

const useStoreQueryDialogLifecycleValue = (): StoreQueryDialogLifecycleValue => {
  const [isOpen, setIsOpen] = useState(false)

  const open = useCallback(() => setIsOpen(true), [])
  const requestClose = useCallback(() => setIsOpen(false), [])
  const onOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (nextOpen) {
        open()
        return
      }

      requestClose()
    },
    [open, requestClose],
  )

  return useMemo(
    () => ({
      isOpen,
      onOpenChange,
      open,
      requestClose,
    }),
    [isOpen, onOpenChange, open, requestClose],
  )
}

export const StoreQueryDialogLifecycleProvider = ({
  children,
}: StoreQueryDialogLifecycleProviderProps) => {
  const value = useStoreQueryDialogLifecycleValue()

  return (
    <StoreQueryDialogLifecycleContext.Provider value={value}>
      {children}
    </StoreQueryDialogLifecycleContext.Provider>
  )
}
