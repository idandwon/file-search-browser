import type { ReactNode } from 'react'
import { useApiKey } from '@/hooks/use-api-key'
import { ApiKeyForm } from './api-key-form'
import { AuthShell } from './auth-shell'
import { ApiKeyValidationPanel } from './api-key-validation-panel'

type ApiKeyGuardProps = {
  readonly children: ReactNode
}

const ApiKeyBootstrapState = () => (
  <AuthShell>
    <ApiKeyValidationPanel />
  </AuthShell>
)

export const ApiKeyGuard = ({ children }: ApiKeyGuardProps) => {
  const { status } = useApiKey()

  if (status === 'authenticated') {
    return <>{children}</>
  }

  if (status === 'bootstrapping') {
    return <ApiKeyBootstrapState />
  }

  return <ApiKeyForm />
}
