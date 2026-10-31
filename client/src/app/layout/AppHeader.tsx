import { RoleNavigation } from './RoleNavigation.tsx'

export function AppHeader() {
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-6xl items-center gap-3.5 px-4 py-4 sm:px-6">
        <div aria-hidden="true" className="size-6.5 shrink-0 bg-signal" />
        <div>
          <p className="text-lg font-extrabold tracking-wide">lastWorche</p>
          <p className="text-xs text-muted">Jede Stunde im Blick.</p>
        </div>
        <p className="ml-auto text-right text-xs text-muted">Demo · Daten fiktiv</p>
      </div>
      <RoleNavigation />
    </header>
  )
}
