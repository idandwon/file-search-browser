import { useContext } from 'react'
import { StoreQueryDialogLifecycleContext } from '@/components/store-query/store-query-dialog-lifecycle-context'

export const useStoreQueryDialogLifecycle = () => {
  const context = useContext(StoreQueryDialogLifecycleContext)

  if (!context) {
    throw new Error(
      'useStoreQueryDialogLifecycle must be used within a StoreQueryDialogLifecycleProvider',
    )
  }

  return context
}
