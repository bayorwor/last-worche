import { useTranslation } from '../i18n/languageContext.ts'

export function PageLoader() {
  const { t } = useTranslation()

  return (
    <p role="status" className="text-sm text-muted">
      {t('common.loading')}
    </p>
  )
}
