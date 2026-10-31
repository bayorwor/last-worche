import { useTranslation } from '../../shared/i18n/languageContext.ts'
import { LanguageSwitcher } from '../../shared/components/LanguageSwitcher.tsx'
import { SessionBar } from './SessionBar.tsx'

export function AppHeader() {
  const { t } = useTranslation()

  return (
    <header className="border-b border-line pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex max-w-360 items-center gap-3.5 px-4 py-4 sm:px-6">
        <img src="/logo.svg" alt="lastWorche" width={328} height={96} className="h-12 w-auto shrink-0" />
        <p className="ml-auto text-right text-xs text-muted">{t('header.demoNotice')}</p>
        <LanguageSwitcher />
      </div>
      <SessionBar />
    </header>
  )
}
