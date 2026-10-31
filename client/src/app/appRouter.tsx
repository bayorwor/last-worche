import { createBrowserRouter, Navigate } from 'react-router'
import { AppLayout } from './layout/AppLayout.tsx'
import { RouteErrorPage } from './layout/RouteErrorPage.tsx'
import { ConsultantBookingPage, ProjectLeadDashboardPage, PurchasingOverviewPage } from './lazyPages.ts'
import { ROUTE_PATHS } from './routePaths.ts'

export const appRouter = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      {
        errorElement: <RouteErrorPage />,
        children: [
          { index: true, element: <Navigate to={ROUTE_PATHS.consultant} replace /> },
          { path: ROUTE_PATHS.consultant, element: <ConsultantBookingPage /> },
          { path: ROUTE_PATHS.projectLead, element: <ProjectLeadDashboardPage /> },
          { path: ROUTE_PATHS.purchasing, element: <PurchasingOverviewPage /> },
          { path: '*', element: <Navigate to={ROUTE_PATHS.consultant} replace /> },
        ],
      },
    ],
  },
])
