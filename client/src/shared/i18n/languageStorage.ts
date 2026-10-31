// Remembers the visitor's own choice on this device. Storage can be blocked, for example in a
// private window. The app then still works, and only forgets the choice.
import { isLanguage, type Language } from './languages.ts'

const STORAGE_KEY = 'lastWorche.language'

export function readSavedLanguage(): Language | null {
  try {
    const savedLanguage = localStorage.getItem(STORAGE_KEY)
    return isLanguage(savedLanguage) ? savedLanguage : null
  } catch {
    return null
  }
}

export function saveLanguage(language: Language) {
  try {
    localStorage.setItem(STORAGE_KEY, language)
  } catch {
    // Nothing to do: the language still applies until the page is closed.
  }
}
