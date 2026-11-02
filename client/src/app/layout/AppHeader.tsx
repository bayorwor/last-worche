import { LanguageSwitcher } from '../../shared/components/LanguageSwitcher.tsx'
import { useTranslation } from '../../shared/i18n/languageContext.ts'
import { useAppSelector } from '../storeHooks.ts'
import { ProfileMenu } from './ProfileMenu.tsx'

// One row. On phones the demo notice moves into the profile menu, so everything else fits.
export function AppHeader() {
  const { t } = useTranslation()
  const user = useAppSelector((state) => state.auth.user)

  return (
    <header className="border-b border-line pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex max-w-360 items-center gap-2.5 px-4 py-3 sm:gap-3.5 sm:px-6">
        <img src="/logo.svg" alt="lastWorche" width={328} height={96} className="h-10 w-auto min-w-0 shrink object-contain object-left sm:h-12" />
        <p className="ml-auto hidden text-right text-xs text-muted sm:block">{t('header.demoNotice')}</p>
        <div className="ml-auto flex shrink-0 items-center gap-2.5 sm:ml-0 sm:gap-3.5">
          <LanguageSwitcher />
          {user && <ProfileMenu user={user} />}
        </div>
      </div>
    </header>
  )
}
