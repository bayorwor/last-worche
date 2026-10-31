import type { MessageKey } from '../../shared/i18n/messages/de.ts'
import type { UserRole } from './authTypes.ts'

export const ROLE_MESSAGE_KEYS: Record<UserRole, { title: MessageKey; subtitle: MessageKey }> = {
  consultant: { title: 'role.consultant.title', subtitle: 'role.consultant.subtitle' },
  project_lead: { title: 'role.projectLead.title', subtitle: 'role.projectLead.subtitle' },
  purchasing: { title: 'role.purchasing.title', subtitle: 'role.purchasing.subtitle' },
}
