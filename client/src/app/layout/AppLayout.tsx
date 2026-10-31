import { Suspense, useEffect } from 'react'
import { Outlet } from 'react-router'
import { restoreSession } from '../../features/auth/authSlice.ts'
import { PageLoader } from '../../shared/components/PageLoader.tsx'
import { useAppDispatch, useAppSelector } from '../storeHooks.ts'
import { AppHeader } from './AppHeader.tsx'

export function AppLayout() {
  const dispatch = useAppDispatch()
  const sessionStatus = useAppSelector((state) => state.auth.sessionStatus)

  // After a reload the server confirms the stored token, and says who it belongs to.
  useEffect(() => {
    if (sessionStatus === 'checking') {
      dispatch(restoreSession())
    }
  }, [dispatch, sessionStatus])

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-6xl px-4 pt-7 pb-[calc(4rem+env(safe-area-inset-bottom))] sm:px-6">
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>
    </>
  )
}
