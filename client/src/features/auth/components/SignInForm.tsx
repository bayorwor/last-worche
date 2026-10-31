import type { FormEvent } from 'react'
import type { ApiError } from '../../../shared/api/getApiError.ts'
import { Button } from '../../../shared/components/Button.tsx'
import { StatusMessage } from '../../../shared/components/StatusMessage.tsx'
import { useTranslation } from '../../../shared/i18n/languageContext.ts'
import type { Credentials } from '../authTypes.ts'
import { PasswordField } from './PasswordField.tsx'

type SignInFormProps = {
  credentials: Credentials
  isSubmitting: boolean
  error: ApiError | null
  onChange: (credentials: Credentials) => void
  onSubmit: () => void
}

export function SignInForm({ credentials, isSubmitting, error, onChange, onSubmit }: SignInFormProps) {
  const { t } = useTranslation()
  const isComplete = credentials.email.trim() !== '' && credentials.password !== ''

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (isComplete) {
      onSubmit()
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="grid gap-5">
      <div>
        <label htmlFor="sign-in-email" className="block text-sm font-semibold">
          {t('signIn.emailLabel')}
        </label>
        <input
          id="sign-in-email"
          type="email"
          value={credentials.email}
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          aria-invalid={error !== null}
          placeholder={t('signIn.emailPlaceholder')}
          onChange={(event) => onChange({ ...credentials, email: event.target.value })}
          className="mt-2 min-h-11 w-full border border-ink bg-panel px-3.5 py-3 text-base placeholder:text-muted aria-invalid:border-signal-strong"
        />
      </div>
      <div>
        <label htmlFor="sign-in-password" className="block text-sm font-semibold">
          {t('signIn.passwordLabel')}
        </label>
        <PasswordField
          id="sign-in-password"
          value={credentials.password}
          isInvalid={error !== null}
          onChange={(password) => onChange({ ...credentials, password })}
        />
      </div>
      {error && <StatusMessage tone="error">{t(error.key, error.values)}</StatusMessage>}
      <Button type="submit" variant="brand" className="w-full" disabled={!isComplete || isSubmitting}>
        {isSubmitting ? t('signIn.submitting') : t('signIn.submit')}
      </Button>
    </form>
  )
}
