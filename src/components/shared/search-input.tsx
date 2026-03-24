import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

type SearchInputProps = {
  readonly value: string
  readonly onChange: (value: string) => void
  readonly placeholder?: string
  readonly rightAdornment?: ReactNode
}

export const SearchInput = ({
  value,
  onChange,
  placeholder = 'Search...',
  rightAdornment,
}: SearchInputProps) => {
  const hasTrailingControls = Boolean(value) || rightAdornment != null

  return (
    <div className="relative">
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {hasTrailingControls ? (
        <div className="absolute right-1 top-1/2 flex -translate-y-1/2 items-center gap-1">
          {rightAdornment ? (
            <div className="flex h-6 w-6 items-center justify-center">
              {rightAdornment}
            </div>
          ) : null}
          {value ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange('')}
              className="group h-6 w-6 p-0"
            >
              <X className="h-3.5 w-3.5 text-muted-foreground transition-colors group-hover:text-foreground" />
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
