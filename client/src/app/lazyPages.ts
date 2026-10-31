// Each role page is loaded on demand, so every role downloads only its own screen as a separate chunk.
import { lazy } from 'react'

export const ConsultantBookingPage = lazy(() => import('../features/bookings/pages/ConsultantBookingPage.tsx'))
export const ProjectLeadDashboardPage = lazy(() => import('../features/budget/pages/ProjectLeadDashboardPage.tsx'))
export const PurchasingOverviewPage = lazy(() => import('../features/purchasing/pages/PurchasingOverviewPage.tsx'))
