import type { ReactNode } from 'react'

type PanelProps = {
  title: string
  aside?: ReactNode
  children: ReactNode
}

export function Panel({ title, aside, children }: PanelProps) {
  return (
    <section className="border border-line bg-panel">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3">
        <h2 className="text-xs font-semibold tracking-widest text-muted uppercase">{title}</h2>
        {aside}
      </header>
      <div className="p-5">{children}</div>
    </section>
  )
}
