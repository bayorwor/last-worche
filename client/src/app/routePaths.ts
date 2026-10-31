import type { UserRole } from '../features/auth/authTypes.ts'

export const ROUTE_PATHS = {
  signIn: '/sign-in',
  consultant: '/consultant',
  projectLead: '/project-lead',
  purchasing: '/purchasing',
} as const

export const ROLE_HOME_PATHS: Record<UserRole, string> = {
  consultant: ROUTE_PATHS.consultant,
  project_lead: ROUTE_PATHS.projectLead,
  purchasing: ROUTE_PATHS.purchasing,
}
