import type { ReactNode } from 'react'

export function PageTitle({ children }: { children: ReactNode }) {
  return <h1 className="mb-5 text-2xl font-extrabold">{children}</h1>
}
