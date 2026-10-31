import { createContext, useContext } from 'react'
import type { Language } from './languages.ts'
import type { MessageKey } from './messages/de.ts'
import type { MessageValues } from './translate.ts'

export type LanguageContextValue = {
  language: Language
  setLanguage: (language: Language) => void
  t: (key: MessageKey, values?: MessageValues) => string
  formatHours: (hours: number) => string
  formatPersonDays: (personDays: number) => string
  formatDate: (isoDate: string) => string
  formatMonth: (month: string) => string
}

export const LanguageContext = createContext<LanguageContextValue | null>(null)

export function useTranslation(): LanguageContextValue {
  const languageContextValue = useContext(LanguageContext)
  if (!languageContextValue) {
    throw new Error('useTranslation must be used inside LanguageProvider.')
  }
  return languageContextValue
}
