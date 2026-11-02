import { describe, expect, test } from 'bun:test'
import { activityMessage } from './activityMessage.ts'
import type { Activity } from './activityTypes.ts'

const formatters = {
  formatHours: (hours: number) => `${hours} h`,
  formatDate: (isoDate: string) => isoDate,
  formatMonth: (month: string) => month,
  formatPersonDays: (personDays: number) => `${personDays} PD`,
}

const approval: Activity = {
  id: 1,
  type: 'proof_approved',
  occurredAtMs: 1000,
  isOwn: false,
  actorName: 'A. Weber',
  orderId: '4500012345',
  period: '2026-10',
  hours: null,
}

const booking: Activity = { ...approval, type: 'booking_created', actorName: 'L. Hoffmann', period: '2026-10-27', hours: 7 }

describe('activityMessage', () => {
  test('a declined follow-up names the person, or stays anonymous when the server hid the name', () => {
    const declined: Activity = { ...approval, type: 'follow_up_declined', period: null, hours: 15 }

    expect(activityMessage(declined, formatters).key).toBe('activity.otherFollowUpDecline')
    expect(activityMessage({ ...declined, actorName: null }, formatters).key).toBe('activity.anonymousFollowUpDecline')
    expect(activityMessage({ ...declined, isOwn: true }, formatters).key).toBe('activity.ownFollowUpDecline')
  })

  test('a saved invoice shows its month and amount', () => {
    const invoice: Activity = { ...approval, type: 'invoice_recorded', isOwn: true, hours: 5 }

    expect(activityMessage(invoice, formatters)).toMatchObject({ key: 'activity.ownInvoice', values: { month: '2026-10', personDays: '5 PD' } })
  })

  test("names who approved a month when the server sends a name", () => {
    expect(activityMessage(approval, formatters).key).toBe('activity.otherApproval')
  })

  test('stays anonymous when the server hid the name', () => {
    expect(activityMessage({ ...approval, actorName: null }, formatters).key).toBe('activity.anonymousApproval')
  })

  test('addresses the reader for their own entries', () => {
    expect(activityMessage({ ...approval, isOwn: true }, formatters).key).toBe('activity.ownApproval')
    expect(activityMessage({ ...booking, isOwn: true }, formatters).key).toBe('activity.ownBooking')
  })

  test('keeps a follow-up request anonymous when the server hid the name', () => {
    const request: Activity = { ...approval, type: 'follow_up_requested', actorName: null, hours: 20 }

    expect(activityMessage(request, formatters)).toEqual({
      key: 'activity.anonymousFollowUpRequest',
      values: { name: '', orderId: '4500012345', personDays: '20 PD' },
    })
  })

  test("shows another person's booking with its hours, day and order", () => {
    expect(activityMessage(booking, formatters)).toEqual({
      key: 'activity.otherBooking',
      values: { name: 'L. Hoffmann', orderId: '4500012345', hours: '7 h', date: '2026-10-27' },
    })
  })
})
