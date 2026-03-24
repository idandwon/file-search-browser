import { ArrowUp, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  STORE_QUERY_DEFAULT_MODEL,
  STORE_QUERY_MODEL_OPTIONS,
  getStoreQueryModelLabel,
  isStoreQueryModel,
  type StoreQueryModel,
} from '@/lib/store-query/config'

export type StoreQueryFormProps = {
  readonly canQuery: boolean
  readonly canSubmit: boolean
  readonly draft: string
  readonly isOpen: boolean
  readonly isPending: boolean
  readonly model: StoreQueryModel
  readonly onModelChange: (model: StoreQueryModel) => void
  readonly onSubmit: () => void
  readonly setDraft: (draft: string) => void
}

const getPlaceholder = (canQuery: boolean) => {
  if (!canQuery) {
    return 'Querying will unlock when this store has active documents.'
  }

  return 'Ask about the documents in this store...'
}

const isInputDisabled = (canQuery: boolean) => !canQuery

const isModelPickerDisabled = (canQuery: boolean, isPending: boolean) =>
  !canQuery || isPending

const composerClassName = 'mx-auto w-full max-w-3xl'
const composerShellClassName =
  'grid min-h-9 grid-cols-[fit-content(40%)_auto_minmax(0,1fr)_auto] items-center gap-2 rounded-md border border-input bg-transparent px-2 py-2 shadow-xs transition-[border-color,box-shadow] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50'

const getNextModel = (
  value: string,
  currentModel: StoreQueryModel,
): StoreQueryModel => {
  if (!isStoreQueryModel(value)) {
    return currentModel
  }

  return value
}

const handleModelChange = ({
  currentModel,
  nextValue,
  onModelChange,
}: {
  readonly currentModel: StoreQueryModel
  readonly nextValue: string
  readonly onModelChange: (model: StoreQueryModel) => void
}): void => {
  const nextModel = getNextModel(nextValue, currentModel)

  if (nextModel === currentModel) {
    return
  }

  if (nextModel === STORE_QUERY_DEFAULT_MODEL) {
    onModelChange(STORE_QUERY_DEFAULT_MODEL)
    return
  }

  onModelChange(nextModel)
}

const StoreQueryModelDivider = () => <Separator orientation="vertical" className="h-4" />

const StoreQueryModelPicker = ({
  disabled,
  model,
  onModelChange,
}: Pick<StoreQueryFormProps, 'model' | 'onModelChange'> & {
  readonly disabled: boolean
}) => (
  <div className="min-w-0 max-w-32">
    <Select
      value={model}
      disabled={disabled}
      onValueChange={(value) =>
        handleModelChange({
          currentModel: model,
          nextValue: value,
          onModelChange,
        })
      }
    >
      <SelectTrigger
        variant="inline"
        aria-label="Select query model"
        title={getStoreQueryModelLabel(model)}
        className="w-full max-w-full min-w-0 justify-start [&>span]:truncate"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STORE_QUERY_MODEL_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value} className="text-xs">
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
)

const StoreQuerySubmitButton = ({
  canSubmit,
  isPending,
}: Pick<StoreQueryFormProps, 'canSubmit' | 'isPending'>) => (
  <div className="flex items-center justify-self-end">
    <Button type="submit" size="icon-xs" disabled={!canSubmit}>
      {isPending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <ArrowUp className="h-3.5 w-3.5" />
      )}
      <span className="sr-only">{isPending ? 'Asking' : 'Ask'}</span>
    </Button>
  </div>
)

const StoreQueryInputShell = ({
  canQuery,
  canSubmit,
  draft,
  isOpen,
  isPending,
  model,
  onModelChange,
  setDraft,
}: Omit<StoreQueryFormProps, 'onSubmit'>) => (
  <div className={composerClassName}>
    <div className={composerShellClassName}>
      <StoreQueryModelPicker
        disabled={isModelPickerDisabled(canQuery, isPending)}
        model={model}
        onModelChange={onModelChange}
      />
      <StoreQueryModelDivider />
      <input
        autoFocus={isOpen}
        type="text"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder={getPlaceholder(canQuery)}
        disabled={isInputDisabled(canQuery)}
        className="min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
      />
      <StoreQuerySubmitButton canSubmit={canSubmit} isPending={isPending} />
    </div>
  </div>
)

export const StoreQueryForm = ({
  canQuery,
  canSubmit,
  draft,
  isOpen,
  isPending,
  model,
  onModelChange,
  onSubmit,
  setDraft,
}: StoreQueryFormProps) => (
  <form
    className="w-full"
    onSubmit={(event) => {
      event.preventDefault()
      void onSubmit()
    }}
  >
    <StoreQueryInputShell
      canQuery={canQuery}
      canSubmit={canSubmit}
      draft={draft}
      isOpen={isOpen}
      isPending={isPending}
      model={model}
      onModelChange={onModelChange}
      setDraft={setDraft}
    />
  </form>
)
