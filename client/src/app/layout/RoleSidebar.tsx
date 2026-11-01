// A column of tabs on large screens, and a row above the page on phones and tablets.
import { NavLink } from 'react-router'
import type { UserRole } from '../../features/auth/authTypes.ts'
import { useRoleText } from '../../features/auth/useRoleText.ts'
import { useTranslation } from '../../shared/i18n/languageContext.ts'
import { ROLE_NAVIGATION } from './navigationItems.ts'

const TAB_CLASSES =
  'flex min-h-11 items-center border-b-2 px-4 py-2.5 text-sm whitespace-nowrap transition-colors duration-200 hover:bg-neutral-soft focus-visible:-outline-offset-2 motion-reduce:transition-none lg:border-b-0 lg:border-l-4'

export function RoleSidebar({ role }: { role: UserRole }) {
  const { t } = useTranslation()
  const roleText = useRoleText()
  const { name, summary } = roleText(role)

  return (
    <nav aria-label={t('navigation.label')} className="min-w-0 lg:sticky lg:top-6 lg:max-h-[calc(100dvh-3rem)] lg:self-start lg:overflow-y-auto lg:border lg:border-line lg:bg-panel">
      <div className="hidden border-b border-line px-4 py-3 lg:block">
        <p className="text-sm font-bold">{name}</p>
        <p className="mt-0.5 text-xs text-muted">{summary}</p>
      </div>
      <ul className="flex overflow-x-auto border-b border-line lg:block lg:border-b-0">
        {ROLE_NAVIGATION[role].map((item) => (
          <li key={item.path} className="shrink-0">
            <NavLink
              to={item.path}
              end
              className={({ isActive }) =>
                `${TAB_CLASSES} ${isActive ? 'border-brand bg-brand-soft font-bold' : 'border-transparent text-muted'}`
              }
            >
              {t(item.labelKey)}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
