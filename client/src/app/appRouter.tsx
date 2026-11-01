import { createBrowserRouter } from 'react-router'
import { AppLayout } from './layout/AppLayout.tsx'
import { HomeRedirect, RedirectIfSignedIn, RequireRole } from './layout/RouteGuards.tsx'
import { RouteErrorPage } from './layout/RouteErrorPage.tsx'
import { SessionLayout } from './layout/SessionLayout.tsx'
import {
  ConsultantBookingPage,
  FollowUpRequestsPage,
  InvoiceCheckPage,
  OrderBookingsPage,
  OrderBudgetPage,
  OrderTotalsPage,
  OwnBookingsPage,
  ProjectLeadDashboardPage,
  ProofsOfWorkPage,
  PurchasingOverviewPage,
  SignInPage,
  SupplierTotalsPage,
} from './lazyPages.ts'
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
                children: [
                  { path: ROUTE_PATHS.consultant, element: <ConsultantBookingPage /> },
                  { path: ROUTE_PATHS.consultantBookings, element: <OwnBookingsPage /> },
                ],
              },
              {
                element: <RequireRole role="project_lead" />,
                children: [
                  {
                    path: ROUTE_PATHS.projectLead,
                    element: <ProjectLeadDashboardPage />,
                    children: [
                      { index: true, element: <OrderBudgetPage /> },
                      { path: ROUTE_PATHS.projectLeadBookings, element: <OrderBookingsPage /> },
                      { path: ROUTE_PATHS.projectLeadProofs, element: <ProofsOfWorkPage /> },
                    ],
                  },
                ],
              },
              {
                element: <RequireRole role="purchasing" />,
                children: [
                  {
                    path: ROUTE_PATHS.purchasing,
                    element: <PurchasingOverviewPage />,
                    children: [
                      { index: true, element: <SupplierTotalsPage /> },
                      { path: ROUTE_PATHS.purchasingOrders, element: <OrderTotalsPage /> },
                      { path: ROUTE_PATHS.purchasingFollowUps, element: <FollowUpRequestsPage /> },
                      { path: ROUTE_PATHS.purchasingInvoiceCheck, element: <InvoiceCheckPage /> },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      { path: '*', element: <HomeRedirect /> },
    ],
  },
])
