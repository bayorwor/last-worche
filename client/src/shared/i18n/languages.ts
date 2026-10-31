export const LANGUAGES = ['de', 'en'] as const

export type Language = (typeof LANGUAGES)[number]

// en-GB rather than en-US, so English users in Europe still see day/month/year.
export const LOCALES: Record<Language, string> = {
  de: 'de-DE',
  en: 'en-GB',
}

export function isLanguage(value: unknown): value is Language {
  return LANGUAGES.includes(value as Language)
}
