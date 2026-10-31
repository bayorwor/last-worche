import { describe, expect, test } from 'bun:test'
import { detectLanguage } from './detectLanguage.ts'

describe('detectLanguage', () => {
  test.each(['Europe/Berlin', 'Europe/Busingen', 'Europe/Vienna', 'Europe/Zurich', 'Europe/Vaduz'])(
    'chooses German in %s, even with an English browser',
    (timeZone) => {
      expect(detectLanguage(timeZone, ['en-US'])).toBe('de')
    },
  )

  test('chooses English elsewhere', () => {
    expect(detectLanguage('Africa/Accra', ['en-GB'])).toBe('en')
  })

  test('chooses German elsewhere when the browser is German', () => {
    expect(detectLanguage('America/New_York', ['de-DE', 'en-US'])).toBe('de')
  })

  test('chooses English when nothing is known', () => {
    expect(detectLanguage('', [])).toBe('en')
  })
})
