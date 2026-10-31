import { LOCALES, type Language } from './languages.ts'
import { de, type MessageKey } from './messages/de.ts'
import { en } from './messages/en.ts'

export type MessageValues = Record<string, string | number>

const MESSAGES: Record<Language, Record<MessageKey, string>> = { de, en }

// Replaces {name} placeholders. Numbers are written the local way, so 0,5 in German and 0.5 in English.
export function translate(language: Language, key: MessageKey, values: MessageValues = {}): string {
  const numberFormatter = new Intl.NumberFormat(LOCALES[language], { maximumFractionDigits: 3 })

  return MESSAGES[language][key].replace(/\{(\w+)\}/g, (placeholder, name: string) => {
    const value = values[name]
    if (value === undefined) {
      return placeholder
    }
    return typeof value === 'number' ? numberFormatter.format(value) : value
  })
}
