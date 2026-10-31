import { useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from '../../../app/storeHooks.ts'
import { LanguageSwitcher } from '../../../shared/components/LanguageSwitcher.tsx'
import { useTranslation } from '../../../shared/i18n/languageContext.ts'
import { codeEntryLeft, fetchTestAccounts, requestCode, verifyCode } from '../authSlice.ts'
import { CodeStep } from '../components/CodeStep.tsx'
import { EmailStep } from '../components/EmailStep.tsx'
import { SignInBrandPanel } from '../components/SignInBrandPanel.tsx'
import { TestAccountList } from '../components/TestAccountList.tsx'

export default function SignInPage() {
  const dispatch = useAppDispatch()
  const { language } = useTranslation()
  const { testAccounts, codeEmail, testCode, codeRequestStatus, verificationStatus, error } = useAppSelector(
    (state) => state.auth,
  )
  const [email, setEmail] = useState('')

  useEffect(() => {
    dispatch(fetchTestAccounts())
  }, [dispatch])

  async function verify(code: string) {
    const result = await dispatch(verifyCode({ email: codeEmail ?? email, code }))
    return verifyCode.fulfilled.match(result)
  }

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <SignInBrandPanel />
      <main className="px-6 pt-5 pb-[calc(2.5rem+env(safe-area-inset-bottom))] lg:px-12 lg:py-8">
        <div className="flex justify-end">
          <LanguageSwitcher />
        </div>
        <div className="mx-auto mt-4 max-w-md lg:mt-10">
          {codeEmail ? (
            <CodeStep
              email={codeEmail}
              testCode={testCode}
              isVerifying={verificationStatus === 'loading'}
              isResending={codeRequestStatus === 'loading'}
              error={error}
              onVerify={verify}
              onResend={() => dispatch(requestCode({ email: codeEmail, language }))}
              onChangeEmail={() => dispatch(codeEntryLeft())}
            />
          ) : (
            <>
              <EmailStep
                email={email}
                isSubmitting={codeRequestStatus === 'loading'}
                error={error}
                onChange={setEmail}
                onSubmit={() => dispatch(requestCode({ email: email.trim(), language }))}
              />
              {testAccounts.length > 0 && (
                <TestAccountList accounts={testAccounts} selectedEmail={email} onSelect={setEmail} />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
