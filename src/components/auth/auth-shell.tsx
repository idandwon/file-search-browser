import type { ReactNode } from 'react'

type AuthShellProps = {
  readonly children: ReactNode
}

export const AuthShell = ({ children }: AuthShellProps) => (
  <div className="relative flex min-h-[100svh] items-center justify-center overflow-hidden px-4 py-8 sm:px-6">
    <div
      aria-hidden
      className="pointer-events-none absolute left-1/2 top-0 h-64 w-[min(40rem,90vw)] -translate-x-1/2 rounded-full bg-primary/6 blur-3xl"
    />
    <div className="relative z-10 w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
      {children}
    </div>
  </div>
)
