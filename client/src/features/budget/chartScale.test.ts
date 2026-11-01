import { describe, expect, test } from 'bun:test'
import { dayNumber, remainingOnDay, scaleLinear } from './chartScale.ts'

const series = [
  { date: '2026-11-03', remainingPersonDays: 56 },
  { date: '2026-11-10', remainingPersonDays: 46 },
  { date: '2026-11-17', remainingPersonDays: 36 },
]

describe('scaleLinear', () => {
  test('maps the ends of the domain to the ends of the range', () => {
    const scale = scaleLinear(0, 10, 100, 200)

    expect(scale(0)).toBe(100)
    expect(scale(10)).toBe(200)
    expect(scale(5)).toBe(150)
  })

  test('copes with a domain of one single value', () => {
    expect(scaleLinear(3, 3, 0, 10)(3)).toBe(0)
  })
})

describe('remainingOnDay', () => {
  test('finds the value of a point on the line', () => {
    expect(remainingOnDay(series, dayNumber('2026-11-10'))).toBe(46)
  })

  test('interpolates between two points', () => {
    expect(remainingOnDay(series, dayNumber('2026-11-06'))).toBe(51.7)
  })

  test('holds the first and last value outside the line', () => {
    expect(remainingOnDay(series, dayNumber('2026-10-01'))).toBe(56)
    expect(remainingOnDay(series, dayNumber('2027-01-01'))).toBe(36)
  })

  test('has no value for an empty line', () => {
    expect(remainingOnDay([], 1)).toBeNull()
  })
})
