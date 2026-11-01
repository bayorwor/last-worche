import type { MessageKey } from '../../shared/i18n/messages/de.ts'
import type { MessageValues } from '../../shared/i18n/translate.ts'
import type { Activity } from './activityTypes.ts'

type ActivityFormatters = {
  formatHours: (hours: number) => string
  formatDate: (isoDate: string) => string
  formatMonth: (month: string) => string
}

// Chooses the sentence for an entry. An entry with no name stays anonymous, because the server hid the name on purpose.
export function activityMessage(activity: Activity, formatters: ActivityFormatters): { key: MessageKey; values: MessageValues } {
  const orderId = activity.orderId ?? ''
  const period = activity.period ?? ''
  const name = activity.actorName ?? ''

  if (activity.type === 'signed_in') {
    return { key: 'activity.signedIn', values: {} }
  }
  if (activity.type === 'profile_updated') {
    return { key: 'activity.profileUpdated', values: {} }
  }
  if (activity.type === 'booking_created') {
    const values = { name, orderId, hours: formatters.formatHours(activity.hours ?? 0), date: formatters.formatDate(period) }
    return { key: activity.isOwn ? 'activity.ownBooking' : 'activity.otherBooking', values }
  }

  const values = { name, orderId, month: formatters.formatMonth(period) }
  if (activity.isOwn) {
    return { key: 'activity.ownApproval', values }
  }
  return { key: activity.actorName ? 'activity.otherApproval' : 'activity.anonymousApproval', values }
}
