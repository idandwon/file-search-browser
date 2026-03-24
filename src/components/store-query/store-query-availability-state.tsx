import { AlertCircle, Clock3 } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

type StoreQueryAvailabilityStateProps = {
  readonly title: string
  readonly description: string
  readonly isProcessing: boolean
}

export const StoreQueryAvailabilityState = ({
  title,
  description,
  isProcessing,
}: StoreQueryAvailabilityStateProps) => {
  if (!title) {
    return null
  }

  const Icon = isProcessing ? Clock3 : AlertCircle

  return (
    <Alert className="mx-auto w-full max-w-lg">
      <Icon />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{description}</AlertDescription>
    </Alert>
  )
}
