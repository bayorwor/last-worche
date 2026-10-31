// Shows who is signed in, in the place of the former role tabs.
import { clearSessionToken } from '../../shared/api/sessionToken.ts'
import { Button } from '../../shared/components/Button.tsx'
import { useTranslation } from '../../shared/i18n/languageContext.ts'
import { signedOut } from '../../features/auth/authSlice.ts'
import { ROLE_MESSAGE_KEYS } from '../../features/auth/roleMessageKeys.ts'
import { useAppDispatch, useAppSelector } from '../storeHooks.ts'

export function SessionBar() {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()
  const user = useAppSelector((state) => state.auth.user)

  if (!user) {
    return null
  }

  function signOut() {
    clearSessionToken()
    dispatch(signedOut())
  }

  return (
    <div className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-2 sm:px-6">
        <p className="text-sm">
          <span className="text-muted">{t('session.signedInAs')}</span> <b>{user.name}</b> ·{' '}
          {t(ROLE_MESSAGE_KEYS[user.role].title)}
        </p>
        <Button variant="ghost" onClick={signOut}>
          {t('session.signOut')}
        </Button>
      </div>
    </div>
  )
}
