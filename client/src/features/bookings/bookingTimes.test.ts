import { describe, expect, test } from 'bun:test'
import { breakMinutesOf, workedHours } from './bookingTimes.ts'

describe('workedHours', () => {
  test('takes the break off the time between start and end', () => {
    expect(workedHours('09:00', '17:00', 60)).toBe(7)
    expect(workedHours('08:30', '12:15', 15)).toBe(3.5)
  })

  test('rounds to two decimals, like the database', () => {
    expect(workedHours('09:00', '17:00', 10)).toBe(7.83)
  })

  test('is zero or less when the times do not work', () => {
    expect(workedHours('17:00', '09:00', 0)).toBeLessThan(0)
    expect(workedHours('09:00', '10:00', 60)).toBe(0)
  })
})

describe('breakMinutesOf', () => {
  test('is the time between start and end that was not worked', () => {
    expect(breakMinutesOf({ startTime: '09:00', endTime: '17:00', hours: 7 })).toBe(60)
    expect(breakMinutesOf({ startTime: '09:00', endTime: '17:00', hours: 8 })).toBe(0)
  })

  test('is never negative', () => {
    expect(breakMinutesOf({ startTime: '09:00', endTime: '10:00', hours: 2 })).toBe(0)
  })
})
