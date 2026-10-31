// Switches between the role views, as in the mockup. This only changes the view:
// who may see which data must be enforced by the server.
import { NavLink } from 'react-router'
import { ROUTE_PATHS } from '../routePaths.ts'

const ROLE_LINKS = [
  { to: ROUTE_PATHS.consultant, title: 'Berater', subtitle: 'Lieferantenseite · buchen' },
  { to: ROUTE_PATHS.projectLead, title: 'Projektleitung', subtitle: 'Kundenseite · prüfen & steuern' },
  { to: ROUTE_PATHS.purchasing, title: 'Einkauf', subtitle: 'Kundenseite · nur Summen' },
]

export function RoleNavigation() {
  return (
    <nav aria-label="Rollenansicht" className="mx-auto flex max-w-6xl border-t border-line">
      {ROLE_LINKS.map(({ to, title, subtitle }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `min-h-11 flex-1 border-t-3 px-3 py-3 transition-colors duration-200 motion-reduce:transition-none sm:px-5 ${
              isActive ? 'border-signal bg-panel' : 'border-transparent hover:bg-neutral-soft'
            }`
          }
        >
          <span className="block text-sm font-bold">{title}</span>
          <span className="hidden text-xs text-muted sm:block">{subtitle}</span>
        </NavLink>
      ))}
    </nav>
  )
}
