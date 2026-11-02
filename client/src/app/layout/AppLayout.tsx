// Three columns on large screens: the role's tabs, the page, and the profile with recent activity.
// With less room, the side column moves below the page and the tabs become a row above it.
import { Suspense } from 'react'
import { Outlet } from 'react-router'
import type { UserRole } from '../../features/auth/authTypes.ts'
import { RecentActivityPanel } from '../../features/activity/components/RecentActivityPanel.tsx'
import { ProfilePanel } from '../../features/auth/components/ProfilePanel.tsx'
import { PageLoader } from '../../shared/components/PageLoader.tsx'
import { useTranslation } from '../../shared/i18n/languageContext.ts'
import type { MessageKey } from '../../shared/i18n/messages/de.ts'
import { useAppSelector } from '../storeHooks.ts'
import { AppHeader } from './AppHeader.tsx'
import { RECENT_ACTIVITY_ID } from './layoutTargets.ts'
import { RoleSidebar } from './RoleSidebar.tsx'

const COLUMN_CLASSES = 'lg:grid-cols-[13rem_minmax(0,1fr)] xl:grid-cols-[13rem_minmax(0,1fr)_20rem]'

const ACTIVITY_SCOPE_KEYS: Record<UserRole, MessageKey> = {
  consultant: 'activity.scopeConsultant',
  project_lead: 'activity.scopeProjectLead',
  purchasing: 'activity.scopePurchasing',
}

export function AppLayout() {
  const { t } = useTranslation()
  const user = useAppSelector((state) => state.auth.user)

  return (
    <>
      <AppHeader />
      <div
        className={`mx-auto grid max-w-360 gap-6 px-4 pt-7 pb-[calc(4rem+env(safe-area-inset-bottom))] sm:px-6 ${user ? COLUMN_CLASSES : ''}`}
      >
        {user && <RoleSidebar role={user.role} />}
        <main className="min-w-0">
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </main>
        {user && (
          // Stays in view beside the page and scrolls by itself. tabIndex lets the keyboard scroll it too.
          // 5.5rem is its 1.5rem gap at the top and the layout's 4rem padding at the bottom, so it fits at the end of a short page.
          <aside
            aria-label={t('layout.sideColumnLabel')}
            tabIndex={0}
            className="grid min-w-0 content-start gap-6 focus-visible:-outline-offset-2 lg:col-start-2 xl:sticky xl:top-6 xl:col-start-3 xl:row-start-1 xl:max-h-[calc(100dvh-5.5rem)] xl:self-start xl:overflow-y-auto"
          >
            <ProfilePanel user={user} />
            {/* Focused by the profile menu, which scrolls it into view. */}
            <div id={RECENT_ACTIVITY_ID} tabIndex={-1} className="min-w-0 scroll-mt-6 focus:outline-2 focus:outline-offset-2 focus:outline-ink">
              <RecentActivityPanel scopeKey={ACTIVITY_SCOPE_KEYS[user.role]} />
            </div>
          </aside>
        )}
      </div>
    </>
  )
}
