// Each role page is loaded on demand, so every role downloads only its own screens as separate chunks.
import { lazy } from 'react'

export const SignInPage = lazy(() => import('../features/auth/pages/SignInPage.tsx'))
export const ConsultantBookingPage = lazy(() => import('../features/bookings/pages/ConsultantBookingPage.tsx'))
export const OwnBookingsPage = lazy(() => import('../features/bookings/pages/OwnBookingsPage.tsx'))
export const ProjectLeadDashboardPage = lazy(() => import('../features/budget/pages/ProjectLeadDashboardPage.tsx'))
export const OrderBudgetPage = lazy(() => import('../features/budget/pages/OrderBudgetPage.tsx'))
export const OrderBookingsPage = lazy(() => import('../features/budget/pages/OrderBookingsPage.tsx'))
export const ProofsOfWorkPage = lazy(() => import('../features/budget/pages/ProofsOfWorkPage.tsx'))
export const PurchasingOverviewPage = lazy(() => import('../features/purchasing/pages/PurchasingOverviewPage.tsx'))
export const SupplierTotalsPage = lazy(() => import('../features/purchasing/pages/SupplierTotalsPage.tsx'))
export const OrderTotalsPage = lazy(() => import('../features/purchasing/pages/OrderTotalsPage.tsx'))
