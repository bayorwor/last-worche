import { createBrowserRouter } from 'react-router'
import { AppLayout } from './layout/AppLayout.tsx'
import { HomeRedirect, RedirectIfSignedIn, RequireRole } from './layout/RouteGuards.tsx'
import { RouteErrorPage } from './layout/RouteErrorPage.tsx'
import { SessionLayout } from './layout/SessionLayout.tsx'
import { ConsultantBookingPage, ProjectLeadDashboardPage, PurchasingOverviewPage, SignInPage } from './lazyPages.ts'
import { ROUTE_PATHS } from './routePaths.ts'

export const appRouter = createBrowserRouter([
  {
    element: <SessionLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <HomeRedirect /> },
      {
        element: <RedirectIfSignedIn />,
        children: [{ path: ROUTE_PATHS.signIn, element: <SignInPage /> }],
      },
      {
        element: <AppLayout />,
        children: [
          {
            errorElement: <RouteErrorPage />,
            children: [
              {
                element: <RequireRole role="consultant" />,
                children: [{ path: ROUTE_PATHS.consultant, element: <ConsultantBookingPage /> }],
              },
              {
                element: <RequireRole role="project_lead" />,
                children: [{ path: ROUTE_PATHS.projectLead, element: <ProjectLeadDashboardPage /> }],
              },
              {
                element: <RequireRole role="purchasing" />,
                children: [{ path: ROUTE_PATHS.purchasing, element: <PurchasingOverviewPage /> }],
              },
            ],
          },
        ],
      },
      { path: '*', element: <HomeRedirect /> },
    ],
  },
])
