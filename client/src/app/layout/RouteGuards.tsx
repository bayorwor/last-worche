// Decide which screen to show for the current session. This only guides the user:
// who may see which data is enforced by the server.
import { Navigate, Outlet } from 'react-router'
import type { UserRole } from '../../features/auth/authTypes.ts'
import { PageLoader } from '../../shared/components/PageLoader.tsx'
import { ROLE_HOME_PATHS, ROUTE_PATHS } from '../routePaths.ts'
import { useAppSelector } from '../storeHooks.ts'

export function HomeRedirect() {
  const { sessionStatus, user } = useAppSelector((state) => state.auth)

  if (sessionStatus === 'checking') {
    return <PageLoader />
  }
  return <Navigate to={user ? ROLE_HOME_PATHS[user.role] : ROUTE_PATHS.signIn} replace />
}

export function RequireRole({ role }: { role: UserRole }) {
  const { sessionStatus, user } = useAppSelector((state) => state.auth)

  if (sessionStatus === 'checking') {
    return <PageLoader />
  }
  if (!user) {
    return <Navigate to={ROUTE_PATHS.signIn} replace />
  }
  return user.role === role ? <Outlet /> : <Navigate to={ROLE_HOME_PATHS[user.role]} replace />
}

export function RedirectIfSignedIn() {
  const { sessionStatus, user } = useAppSelector((state) => state.auth)

  if (sessionStatus === 'checking') {
    return <PageLoader />
  }
  return user ? <Navigate to={ROLE_HOME_PATHS[user.role]} replace /> : <Outlet />
}
