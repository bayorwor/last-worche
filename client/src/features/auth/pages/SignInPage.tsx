import { useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from '../../../app/storeHooks.ts'
import { LanguageSwitcher } from '../../../shared/components/LanguageSwitcher.tsx'
import { useTranslation } from '../../../shared/i18n/languageContext.ts'
import { fetchTestAccounts, signIn } from '../authSlice.ts'
import type { Credentials } from '../authTypes.ts'
import { SignInBrandPanel } from '../components/SignInBrandPanel.tsx'
import { SignInForm } from '../components/SignInForm.tsx'
import { TestAccountList } from '../components/TestAccountList.tsx'

export default function SignInPage() {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()
  const { testAccounts, signInStatus, error } = useAppSelector((state) => state.auth)
  const [credentials, setCredentials] = useState<Credentials>({ email: '', password: '' })

  useEffect(() => {
    dispatch(fetchTestAccounts())
  }, [dispatch])

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <SignInBrandPanel />
      <main className="px-6 pt-5 pb-[calc(2.5rem+env(safe-area-inset-bottom))] lg:px-12 lg:py-8">
        <div className="flex justify-end">
          <LanguageSwitcher />
        </div>
        <div className="mx-auto mt-4 max-w-md lg:mt-10">
          <h1 className="text-3xl font-extrabold">{t('signIn.pageTitle')}</h1>
          <p className="mt-2 mb-7 text-sm text-muted">{t('signIn.intro')}</p>
          <SignInForm
            credentials={credentials}
            isSubmitting={signInStatus === 'loading'}
            error={error}
            onChange={setCredentials}
            onSubmit={() => dispatch(signIn(credentials))}
          />
          {testAccounts && (
            <TestAccountList
              testAccounts={testAccounts}
              selectedEmail={credentials.email}
              onSelect={({ email }) => setCredentials({ email, password: testAccounts.password })}
            />
          )}
        </div>
      </main>
    </div>
  )
}
