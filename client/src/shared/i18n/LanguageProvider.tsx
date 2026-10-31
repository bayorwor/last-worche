import { useEffect, useState, type ReactNode } from 'react'
import { formatDate, formatHours, formatPersonDays } from '../utils/formatters.ts'
import { detectLanguage } from './detectLanguage.ts'
import { LanguageContext } from './languageContext.ts'
import type { Language } from './languages.ts'
import { readSavedLanguage, saveLanguage } from './languageStorage.ts'
import { translate } from './translate.ts'

// The visitor's own choice always wins over the location.
function getInitialLanguage(): Language {
  const { timeZone } = Intl.DateTimeFormat().resolvedOptions()
  return readSavedLanguage() ?? detectLanguage(timeZone, navigator.languages)
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setCurrentLanguage] = useState(getInitialLanguage)

  // Screen readers and browser translation read the page language from <html lang>.
  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  function setLanguage(nextLanguage: Language) {
    saveLanguage(nextLanguage)
    setCurrentLanguage(nextLanguage)
  }

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t: (key, values) => translate(language, key, values),
        formatHours: (hours) => formatHours(hours, language),
        formatPersonDays: (personDays) => formatPersonDays(personDays, language),
        formatDate: (isoDate) => formatDate(isoDate, language),
      }}
    >
      {children}
    </LanguageContext.Provider>
  )
}
