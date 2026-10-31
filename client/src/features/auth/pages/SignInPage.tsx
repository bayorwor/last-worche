import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '../../../app/storeHooks.ts'
import { Button } from '../../../shared/components/Button.tsx'
import { PageLoader } from '../../../shared/components/PageLoader.tsx'
import { PageTitle } from '../../../shared/components/PageTitle.tsx'
import { Panel } from '../../../shared/components/Panel.tsx'
import { StatusMessage } from '../../../shared/components/StatusMessage.tsx'
import { useTranslation } from '../../../shared/i18n/languageContext.ts'
import { fetchDemoUsers, signIn } from '../authSlice.ts'
import { DemoUserList } from '../components/DemoUserList.tsx'

export default function SignInPage() {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()
  const { demoUsers, demoUsersStatus, signInStatus, error } = useAppSelector((state) => state.auth)

  useEffect(() => {
    dispatch(fetchDemoUsers())
  }, [dispatch])

  return (
    <div className="mx-auto max-w-xl">
      <PageTitle>{t('signIn.pageTitle')}</PageTitle>
      <Panel title={t('signIn.panelTitle')}>
        <p className="mb-4 text-sm text-muted">{t('signIn.noPassword')}</p>
        {demoUsersStatus === 'loading' && demoUsers.length === 0 && <PageLoader />}
        <DemoUserList
          users={demoUsers}
          isSigningIn={signInStatus === 'loading'}
          onSelect={(userId) => dispatch(signIn(userId))}
        />
        {error && (
          <div className="mt-4">
            <StatusMessage tone="error">{t(error.key, error.values)}</StatusMessage>
            {demoUsers.length === 0 && (
              <Button className="mt-3" onClick={() => dispatch(fetchDemoUsers())}>
                {t('common.retry')}
              </Button>
            )}
          </div>
        )}
      </Panel>
    </div>
  )
}
