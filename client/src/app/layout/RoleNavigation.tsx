// Switches between the role views, as in the mockup. This only changes the view:
// who may see which data must be enforced by the server.
import { NavLink } from 'react-router'
import type { MessageKey } from '../../shared/i18n/messages/de.ts'
import { useTranslation } from '../../shared/i18n/languageContext.ts'
import { ROUTE_PATHS } from '../routePaths.ts'

const ROLE_LINKS: { to: string; titleKey: MessageKey; subtitleKey: MessageKey }[] = [
  { to: ROUTE_PATHS.consultant, titleKey: 'nav.consultant.title', subtitleKey: 'nav.consultant.subtitle' },
  { to: ROUTE_PATHS.projectLead, titleKey: 'nav.projectLead.title', subtitleKey: 'nav.projectLead.subtitle' },
  { to: ROUTE_PATHS.purchasing, titleKey: 'nav.purchasing.title', subtitleKey: 'nav.purchasing.subtitle' },
]

export function RoleNavigation() {
  const { t } = useTranslation()

  return (
    <nav aria-label={t('nav.label')} className="mx-auto flex max-w-6xl border-t border-line">
      {ROLE_LINKS.map(({ to, titleKey, subtitleKey }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `min-h-11 flex-1 border-t-3 px-3 py-3 transition-colors duration-200 motion-reduce:transition-none sm:px-5 ${
              isActive ? 'border-signal bg-panel' : 'border-transparent hover:bg-neutral-soft'
            }`
          }
        >
          <span className="block text-sm font-bold">{t(titleKey)}</span>
          <span className="hidden text-xs text-muted sm:block">{t(subtitleKey)}</span>
        </NavLink>
      ))}
    </nav>
  )
}
