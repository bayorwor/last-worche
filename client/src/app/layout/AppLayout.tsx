import { Suspense } from 'react'
import { Outlet } from 'react-router'
import { PageLoader } from '../../shared/components/PageLoader.tsx'
import { AppHeader } from './AppHeader.tsx'

export function AppLayout() {
  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-6xl px-4 pt-7 pb-16 sm:px-6">
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>
    </>
  )
}
