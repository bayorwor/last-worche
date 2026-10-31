import type { Language } from '../i18n/languages.ts'
import { useTranslation } from '../i18n/languageContext.ts'

// Each language is named in itself, so people can find theirs whatever language is showing.
const LANGUAGE_OPTIONS: { language: Language; label: string; name: string }[] = [
  { language: 'de', label: 'DE', name: 'Deutsch' },
  { language: 'en', label: 'EN', name: 'English' },
]

export function LanguageSwitcher() {
  const { language: currentLanguage, setLanguage, t } = useTranslation()

  return (
    <div role="group" aria-label={t('language.switcherLabel')} className="flex shrink-0 border border-ink">
      {LANGUAGE_OPTIONS.map(({ language, label, name }) => (
        <button
          key={language}
          type="button"
          lang={language}
          aria-label={name}
          aria-pressed={language === currentLanguage}
          onClick={() => setLanguage(language)}
          className={`min-h-11 min-w-11 cursor-pointer px-2 text-xs font-bold transition-colors duration-200 motion-reduce:transition-none ${
            language === currentLanguage ? 'bg-ink text-white' : 'hover:bg-neutral-soft'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
