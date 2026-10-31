import { expect, test } from 'bun:test'
import { todayIsoDate } from './todayIsoDate.ts'

test('uses the local date and pads month and day', () => {
  expect(todayIsoDate(new Date(2026, 0, 5, 0, 30))).toBe('2026-01-05')
})

test('stays on the local day just before and after midnight', () => {
  expect(todayIsoDate(new Date(2026, 10, 3, 0, 0))).toBe('2026-11-03')
  expect(todayIsoDate(new Date(2026, 10, 3, 23, 59))).toBe('2026-11-03')
})
