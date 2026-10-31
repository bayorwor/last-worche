// Runs around every screen: loads the roles, and after a reload asks the server to confirm the stored
// session and say who it belongs to.
import { Suspense, useEffect } from 'react'
import { Outlet } from 'react-router'
import { fetchRoles, restoreSession } from '../../features/auth/authSlice.ts'
import { PageLoader } from '../../shared/components/PageLoader.tsx'
import { useAppDispatch, useAppSelector } from '../storeHooks.ts'

export function SessionLayout() {
  const dispatch = useAppDispatch()
  const sessionStatus = useAppSelector((state) => state.auth.sessionStatus)

  useEffect(() => {
    dispatch(fetchRoles())
  }, [dispatch])

  useEffect(() => {
    if (sessionStatus === 'checking') {
      dispatch(restoreSession())
    }
  }, [dispatch, sessionStatus])

  return (
    <Suspense
      fallback={
        <div className="p-6 pt-[max(1.5rem,env(safe-area-inset-top))]">
          <PageLoader />
        </div>
      }
    >
      <Outlet />
    </Suspense>
  )
}
