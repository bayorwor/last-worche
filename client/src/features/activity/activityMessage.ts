import type { MessageKey } from '../../shared/i18n/messages/de.ts'
import type { MessageValues } from '../../shared/i18n/translate.ts'
import type { Activity } from './activityTypes.ts'

type ActivityFormatters = {
  formatHours: (hours: number) => string
  formatDate: (isoDate: string) => string
  formatMonth: (month: string) => string
  formatPersonDays: (personDays: number) => string
}

const FOLLOW_UP_KEYS: Record<'follow_up_requested' | 'follow_up_confirmed' | 'follow_up_declined', { own: MessageKey; other: MessageKey; anonymous: MessageKey }> = {
  follow_up_requested: { own: 'activity.ownFollowUpRequest', other: 'activity.otherFollowUpRequest', anonymous: 'activity.anonymousFollowUpRequest' },
  follow_up_confirmed: { own: 'activity.ownFollowUpConfirm', other: 'activity.otherFollowUpConfirm', anonymous: 'activity.anonymousFollowUpConfirm' },
  follow_up_declined: { own: 'activity.ownFollowUpDecline', other: 'activity.otherFollowUpDecline', anonymous: 'activity.anonymousFollowUpDecline' },
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

  if (activity.type === 'follow_up_requested' || activity.type === 'follow_up_confirmed' || activity.type === 'follow_up_declined') {
    const values = { name, orderId, personDays: formatters.formatPersonDays(activity.hours ?? 0) }
    const keys = FOLLOW_UP_KEYS[activity.type]
    if (activity.isOwn) {
      return { key: keys.own, values }
    }
    return { key: activity.actorName ? keys.other : keys.anonymous, values }
  }
  if (activity.type === 'invoice_recorded') {
    const values = { name, orderId, month: formatters.formatMonth(period), personDays: formatters.formatPersonDays(activity.hours ?? 0) }
    return { key: activity.isOwn ? 'activity.ownInvoice' : 'activity.otherInvoice', values }
  }

  const values = { name, orderId, month: formatters.formatMonth(period) }
  if (activity.isOwn) {
    return { key: 'activity.ownApproval', values }
  }
  return { key: activity.actorName ? 'activity.otherApproval' : 'activity.anonymousApproval', values }
}
