import { describe, expect, test } from 'bun:test'
import { activityMessage } from './activityMessage.ts'
import type { Activity } from './activityTypes.ts'

const formatters = {
  formatHours: (hours: number) => `${hours} h`,
  formatDate: (isoDate: string) => isoDate,
  formatMonth: (month: string) => month,
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

  test("shows another person's booking with its hours, day and order", () => {
    expect(activityMessage(booking, formatters)).toEqual({
      key: 'activity.otherBooking',
      values: { name: 'L. Hoffmann', orderId: '4500012345', hours: '7 h', date: '2026-10-27' },
    })
  })
})
