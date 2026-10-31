import type { FormEvent } from 'react'
import type { ApiError } from '../../../shared/api/getApiError.ts'
import { Button } from '../../../shared/components/Button.tsx'
import { StatusMessage } from '../../../shared/components/StatusMessage.tsx'
import { useTranslation } from '../../../shared/i18n/languageContext.ts'

type EmailStepProps = {
  email: string
  isSubmitting: boolean
  error: ApiError | null
  onChange: (email: string) => void
  onSubmit: () => void
}

export function EmailStep({ email, isSubmitting, error, onChange, onSubmit }: EmailStepProps) {
  const { t } = useTranslation()
  const isComplete = email.trim() !== ''

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (isComplete) {
      onSubmit()
    }
  }

  return (
    <>
      <h1 className="text-3xl font-extrabold">{t('signIn.pageTitle')}</h1>
      <p className="mt-2 mb-7 text-sm text-muted">{t('signIn.intro')}</p>
      <form noValidate onSubmit={handleSubmit} className="grid gap-5">
        <div>
          <label htmlFor="sign-in-email" className="block text-sm font-semibold">
            {t('signIn.emailLabel')}
          </label>
          <input
            id="sign-in-email"
            type="email"
            value={email}
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            aria-invalid={error !== null}
            placeholder={t('signIn.emailPlaceholder')}
            onChange={(event) => onChange(event.target.value)}
            className="mt-2 min-h-11 w-full border border-ink bg-panel px-3.5 py-3 text-base placeholder:text-muted aria-invalid:border-signal-strong"
          />
        </div>
        {error && <StatusMessage tone="error">{t(error.key, error.values)}</StatusMessage>}
        <Button type="submit" variant="brand" className="w-full" disabled={!isComplete || isSubmitting}>
          {isSubmitting ? t('signIn.sendingCode') : t('signIn.sendCode')}
        </Button>
      </form>
    </>
  )
}
