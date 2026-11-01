// The tabs of each role. This only guides the user: what a role may read is enforced by the server.
import type { UserRole } from '../../features/auth/authTypes.ts'
import type { MessageKey } from '../../shared/i18n/messages/de.ts'
import { ROUTE_PATHS } from '../routePaths.ts'

type NavigationItem = {
  path: string
  labelKey: MessageKey
}

export const ROLE_NAVIGATION: Record<UserRole, NavigationItem[]> = {
  consultant: [
    { path: ROUTE_PATHS.consultant, labelKey: 'navigation.bookTime' },
    { path: ROUTE_PATHS.consultantBookings, labelKey: 'navigation.ownBookings' },
  ],
  project_lead: [
    { path: ROUTE_PATHS.projectLead, labelKey: 'navigation.budget' },
    { path: ROUTE_PATHS.projectLeadBookings, labelKey: 'navigation.orderBookings' },
    { path: ROUTE_PATHS.projectLeadProofs, labelKey: 'navigation.proofsOfWork' },
  ],
  purchasing: [
    { path: ROUTE_PATHS.purchasing, labelKey: 'navigation.suppliers' },
    { path: ROUTE_PATHS.purchasingOrders, labelKey: 'navigation.orders' },
    { path: ROUTE_PATHS.purchasingFollowUps, labelKey: 'navigation.followUps' },
    { path: ROUTE_PATHS.purchasingInvoiceCheck, labelKey: 'navigation.invoiceCheck' },
  ],
}
