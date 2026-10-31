// Shown when a page crashes or its chunk cannot be downloaded, for example after a new deployment.
import { Button } from '../../shared/components/Button.tsx'
import { StatusMessage } from '../../shared/components/StatusMessage.tsx'

export function RouteErrorPage() {
  return (
    <div className="max-w-xl">
      <StatusMessage tone="error">Diese Seite konnte nicht geladen werden.</StatusMessage>
      <Button className="mt-4" onClick={() => window.location.reload()}>
        Seite neu laden
      </Button>
    </div>
  )
}
