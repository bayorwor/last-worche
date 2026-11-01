import type { UserRole } from '../features/auth/authTypes.ts'

export const ROUTE_PATHS = {
  signIn: '/sign-in',
  consultant: '/consultant',
  consultantBookings: '/consultant/bookings',
  projectLead: '/project-lead',
  projectLeadBookings: '/project-lead/bookings',
  projectLeadProofs: '/project-lead/proofs-of-work',
  purchasing: '/purchasing',
  purchasingOrders: '/purchasing/orders',
  purchasingFollowUps: '/purchasing/follow-up-requests',
} as const

export const ROLE_HOME_PATHS: Record<UserRole, string> = {
  consultant: ROUTE_PATHS.consultant,
  project_lead: ROUTE_PATHS.projectLead,
  purchasing: ROUTE_PATHS.purchasing,
}
