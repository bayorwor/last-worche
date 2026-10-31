import { LOCALES, type Language } from '../i18n/languages.ts'

const PERSON_DAY_UNITS: Record<Language, string> = { de: 'PT', en: 'PD' }

// A non-breaking space keeps the number and its unit on one line.
export function formatHours(hours: number, language: Language): string {
  const formatter = new Intl.NumberFormat(LOCALES[language], { minimumFractionDigits: 1, maximumFractionDigits: 2 })
  return `${formatter.format(hours)}\u00a0h`
}

export function formatPersonDays(personDays: number, language: Language): string {
  const formatter = new Intl.NumberFormat(LOCALES[language], { minimumFractionDigits: 1, maximumFractionDigits: 3 })
  return `${formatter.format(personDays)}\u00a0${PERSON_DAY_UNITS[language]}`
}

// Expects YYYY-MM-DD. UTC on both sides, so the shown day never shifts with the viewer's time zone.
export function formatDate(isoDate: string, language: Language): string {
  const formatter = new Intl.DateTimeFormat(LOCALES[language], {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  })
  return formatter.format(new Date(`${isoDate}T00:00:00Z`))
}
