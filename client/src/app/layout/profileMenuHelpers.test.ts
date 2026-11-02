import { describe, expect, test } from 'bun:test'
import { initialsOf, nextMenuIndex } from './profileMenuHelpers.ts'

describe('initialsOf', () => {
  test('takes the first letters of the first and last word', () => {
    expect(initialsOf('L. Hoffmann')).toBe('LH')
    expect(initialsOf('Anna Maria Weber')).toBe('AW')
  })

  test('takes one letter from a single name', () => {
    expect(initialsOf('Mira')).toBe('M')
  })

  test('handles extra spaces, an umlaut and an empty name', () => {
    expect(initialsOf('  mira   ögün ')).toBe('MÖ')
    expect(initialsOf('')).toBe('')
  })
})

describe('nextMenuIndex', () => {
  test('moves down and up, and wraps at both ends', () => {
    expect(nextMenuIndex(0, 'ArrowDown', 3)).toBe(1)
    expect(nextMenuIndex(2, 'ArrowDown', 3)).toBe(0)
    expect(nextMenuIndex(0, 'ArrowUp', 3)).toBe(2)
  })

  test('jumps to the first and last item', () => {
    expect(nextMenuIndex(1, 'Home', 3)).toBe(0)
    expect(nextMenuIndex(1, 'End', 3)).toBe(2)
  })

  test('another key, or an empty menu, does not move the focus', () => {
    expect(nextMenuIndex(1, 'a', 3)).toBeNull()
    expect(nextMenuIndex(0, 'ArrowDown', 0)).toBeNull()
  })
})
