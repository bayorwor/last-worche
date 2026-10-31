// Chooses the first language of a new visitor. The time zone is the location signal: it needs no
// permission prompt and no outside service, and it never leaves the device. See ADR-0009.
import type { Language } from './languages.ts'

// Germany (with its exclave Büsingen), Austria, Switzerland and Liechtenstein.
const GERMAN_SPEAKING_TIME_ZONES = new Set([
  'Europe/Berlin',
  'Europe/Busingen',
  'Europe/Vienna',
  'Europe/Zurich',
  'Europe/Vaduz',
])

export function detectLanguage(timeZone: string, browserLanguages: readonly string[]): Language {
  if (GERMAN_SPEAKING_TIME_ZONES.has(timeZone)) {
    return 'de'
  }
  // A German browser elsewhere, for example a German consultant working abroad.
  return browserLanguages[0]?.toLowerCase().startsWith('de') ? 'de' : 'en'
}
