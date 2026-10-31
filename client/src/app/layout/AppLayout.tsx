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
          <aside aria-label={t('layout.sideColumnLabel')} className="grid min-w-0 content-start gap-6 lg:col-start-2 xl:col-start-3 xl:row-start-1">
            <ProfilePanel user={user} />
            <RecentActivityPanel scopeKey={ACTIVITY_SCOPE_KEYS[user.role]} />
          </aside>
        )}
      </div>
    </>
  )
}
