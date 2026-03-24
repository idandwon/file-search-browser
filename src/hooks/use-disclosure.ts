import { useCallback, useState } from 'react'

export const useDisclosure = (initialValue = false) => {
  const [isOpen, setIsOpen] = useState(initialValue)
  const close = useCallback(() => setIsOpen(false), [])
  const open = useCallback(() => setIsOpen(true), [])
  const toggle = useCallback(() => setIsOpen((value) => !value), [])

  return { close, isOpen, onOpenChange: setIsOpen, open, toggle } as const
}
