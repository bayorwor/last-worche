import { useState } from 'react'
import { useTranslation } from '../../../shared/i18n/languageContext.ts'

type PasswordFieldProps = {
  id: string
  value: string
  isInvalid: boolean
  onChange: (value: string) => void
}

export function PasswordField({ id, value, isInvalid, onChange }: PasswordFieldProps) {
  const { t } = useTranslation()
  const [isVisible, setIsVisible] = useState(false)

  return (
    <div className="relative mt-2">
      <input
        id={id}
        type={isVisible ? 'text' : 'password'}
        value={value}
        autoComplete="current-password"
        autoCapitalize="none"
        spellCheck={false}
        maxLength={200}
        aria-invalid={isInvalid}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 w-full border border-ink bg-panel py-3 pr-12 pl-3.5 text-base aria-invalid:border-signal-strong"
      />
      <button
        type="button"
        aria-label={isVisible ? t('signIn.hidePassword') : t('signIn.showPassword')}
        aria-pressed={isVisible}
        onClick={() => setIsVisible(!isVisible)}
        className="absolute inset-y-0 right-0 flex w-11 cursor-pointer items-center justify-center text-muted transition-colors duration-200 hover:text-ink motion-reduce:transition-none"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
          {isVisible && <path d="M4 4l16 16" />}
        </svg>
      </button>
    </div>
  )
}
