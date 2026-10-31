import { useEffect, useState, type FormEvent } from 'react'
import type { ApiError } from '../../../shared/api/getApiError.ts'
import { Button } from '../../../shared/components/Button.tsx'
import { StatusMessage } from '../../../shared/components/StatusMessage.tsx'
import { useTranslation } from '../../../shared/i18n/languageContext.ts'
import { CODE_LENGTH, CodeInput } from './CodeInput.tsx'

const RESEND_WAIT_SECONDS = 60 // the same wait as on the server

type CodeStepProps = {
  email: string
  testCode: string | null
  isVerifying: boolean
  isResending: boolean
  error: ApiError | null
  // Resolves to whether the code was accepted.
  onVerify: (code: string) => Promise<boolean>
  onResend: () => void
  onChangeEmail: () => void
}

export function CodeStep({ email, testCode, isVerifying, isResending, error, onVerify, onResend, onChangeEmail }: CodeStepProps) {
  const { t } = useTranslation()
  const [code, setCode] = useState('')
  const [resendWaitSeconds, setResendWaitSeconds] = useState(RESEND_WAIT_SECONDS)

  useEffect(() => {
    if (resendWaitSeconds === 0) {
      return undefined
    }
    const timer = setTimeout(() => setResendWaitSeconds(resendWaitSeconds - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendWaitSeconds])

  async function verify(fullCode: string) {
    if (!(await onVerify(fullCode))) {
      setCode('')
    }
  }

  // The last digit submits by itself, so nobody has to reach for a button.
  function changeCode(nextCode: string) {
    setCode(nextCode)
    if (nextCode.length === CODE_LENGTH) {
      void verify(nextCode)
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (code.length === CODE_LENGTH) {
      void verify(code)
    }
  }

  function resend() {
    setCode('')
    setResendWaitSeconds(RESEND_WAIT_SECONDS)
    onResend()
  }

  return (
    <>
      <h1 className="text-3xl font-extrabold">{t('signIn.codeTitle')}</h1>
      <p role="status" className="mt-2 mb-7 text-sm break-words text-muted">
        {t('signIn.codeSentTo', { email })}
      </p>

      {testCode && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border border-brand bg-brand-soft p-3.5">
          <div>
            <p className="text-xs font-semibold text-brand-strong">{t('signIn.testModeNotice')}</p>
            <p className="mt-0.5 text-xl font-bold tracking-widest tabular-nums">{testCode}</p>
          </div>
          <Button variant="ghost" disabled={isVerifying} onClick={() => changeCode(testCode)}>
            {t('signIn.useTestCode')}
          </Button>
        </div>
      )}

      <form noValidate onSubmit={handleSubmit} className="grid gap-5">
        <div>
          <label htmlFor="sign-in-code" className="block text-sm font-semibold">
            {t('signIn.codeLabel')}
          </label>
          <CodeInput id="sign-in-code" value={code} isInvalid={error !== null} isDisabled={isVerifying} onChange={changeCode} />
        </div>
        {error && <StatusMessage tone="error">{t(error.key, error.values)}</StatusMessage>}
        <Button type="submit" variant="brand" className="w-full" disabled={code.length < CODE_LENGTH || isVerifying}>
          {isVerifying ? t('signIn.verifying') : t('signIn.verify')}
        </Button>
      </form>

      <div className="mt-4 flex flex-wrap justify-between gap-x-4 gap-y-1">
        <button
          type="button"
          disabled={resendWaitSeconds > 0 || isResending}
          onClick={resend}
          className="min-h-11 cursor-pointer text-sm font-semibold underline underline-offset-4 disabled:cursor-not-allowed disabled:text-muted disabled:no-underline"
        >
          {resendWaitSeconds > 0 ? t('signIn.resendIn', { seconds: resendWaitSeconds }) : t('signIn.resend')}
        </button>
        <button
          type="button"
          onClick={onChangeEmail}
          className="min-h-11 cursor-pointer text-sm font-semibold underline underline-offset-4"
        >
          {t('signIn.changeEmail')}
        </button>
      </div>
    </>
  )
}
