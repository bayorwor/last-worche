// Shown when a page crashes or its chunk cannot be downloaded, for example after a new deployment.
import { Button } from '../../shared/components/Button.tsx'
import { StatusMessage } from '../../shared/components/StatusMessage.tsx'
import { useTranslation } from '../../shared/i18n/languageContext.ts'

export function RouteErrorPage() {
  const { t } = useTranslation()

  return (
    <div className="max-w-xl">
      <StatusMessage tone="error">{t('routeError.message')}</StatusMessage>
      <Button className="mt-4" onClick={() => window.location.reload()}>
        {t('routeError.reload')}
      </Button>
    </div>
  )
}
