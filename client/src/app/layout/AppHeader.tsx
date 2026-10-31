import { useTranslation } from '../../shared/i18n/languageContext.ts'
import { LanguageSwitcher } from './LanguageSwitcher.tsx'
import { RoleNavigation } from './RoleNavigation.tsx'

export function AppHeader() {
  const { t } = useTranslation()

  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-6xl items-center gap-3.5 px-4 py-4 sm:px-6">
        <div aria-hidden="true" className="size-6.5 shrink-0 bg-signal" />
        <div>
          <p className="text-lg font-extrabold tracking-wide">lastWorche</p>
          <p className="text-xs text-muted">{t('header.tagline')}</p>
        </div>
        <p className="ml-auto text-right text-xs text-muted">{t('header.demoNotice')}</p>
        <LanguageSwitcher />
      </div>
      <RoleNavigation />
    </header>
  )
}
