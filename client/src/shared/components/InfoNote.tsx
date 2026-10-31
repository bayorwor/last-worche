import type { ReactNode } from 'react'

export function InfoNote({ children }: { children: ReactNode }) {
  return <p className="mt-4 border-l-3 border-signal pl-3 text-sm text-muted">{children}</p>
}
