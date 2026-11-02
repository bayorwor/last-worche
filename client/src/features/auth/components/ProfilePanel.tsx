// The signed-in person's own details. Only the name can be changed: the email is how they sign in,
// and the role is given to them. The server enforces both.
import { useState, type FormEvent } from 'react'
import { useAppDispatch, useAppSelector } from '../../../app/storeHooks.ts'
import { Button } from '../../../shared/components/Button.tsx'
import { Panel } from '../../../shared/components/Panel.tsx'
import { StatusMessage } from '../../../shared/components/StatusMessage.tsx'
import { useTranslation } from '../../../shared/i18n/languageContext.ts'
import { profileEditCancelled, profileEditStarted, saveProfile } from '../authSlice.ts'
import type { SessionUser } from '../authTypes.ts'
import { useRoleText } from '../useRoleText.ts'

export function ProfilePanel({ user }: { user: SessionUser }) {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()
  const roleText = useRoleText()
  const { profileStatus, profileError, isEditingProfile: isEditing } = useAppSelector((state) => state.auth)
  const [draftName, setDraftName] = useState<string | null>(null)
  const isSaving = profileStatus === 'loading'

  function stopEditing() {
    dispatch(profileEditCancelled())
    setDraftName(null)
  }

  async function save(event: FormEvent) {
    event.preventDefault()
    const result = await dispatch(saveProfile(draftName ?? user.name))
    if (saveProfile.fulfilled.match(result)) {
      setDraftName(null)
    }
  }

  return (
    <Panel
      title={t('profile.panelTitle')}
      aside={
        !isEditing && (
          <Button variant="ghost" onClick={() => dispatch(profileEditStarted())}>
            {t('profile.edit')}
          </Button>
        )
      }
    >
      {isEditing && (
        <form onSubmit={save} className="mb-4 border-b border-line pb-4">
          <label htmlFor="profile-name" className="block text-sm font-semibold">
            {t('profile.name')}
          </label>
          <input
            id="profile-name"
            autoFocus
            name="name"
            autoComplete="name"
            required
            minLength={2}
            maxLength={100}
            value={draftName ?? user.name}
            onChange={(event) => setDraftName(event.target.value)}
            className="mt-2 min-h-11 w-full border border-ink bg-paper px-3.5 py-3 text-base"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? t('profile.saving') : t('profile.save')}
            </Button>
            <Button variant="ghost" disabled={isSaving} onClick={stopEditing}>
              {t('profile.cancel')}
            </Button>
          </div>
        </form>
      )}
      <dl className="grid gap-3 text-sm">
        {!isEditing && (
          <div>
            <dt className="text-muted">{t('profile.name')}</dt>
            <dd className="font-bold break-words">{user.name}</dd>
          </div>
        )}
        <div>
          <dt className="text-muted">{t('profile.email')}</dt>
          <dd className="break-words">{user.email}</dd>
          {isEditing && <dd className="mt-1 text-xs text-muted">{t('profile.emailHint')}</dd>}
        </div>
        <div>
          <dt className="text-muted">{t('profile.role')}</dt>
          <dd>{roleText(user.role).name}</dd>
        </div>
      </dl>
      {profileError && (
        <StatusMessage tone="error" className="mt-4">
          {t(profileError.key, profileError.values)}
        </StatusMessage>
      )}
      {!isEditing && profileStatus === 'succeeded' && (
        <StatusMessage tone="success" className="mt-4">
          {t('profile.saved')}
        </StatusMessage>
      )}
    </Panel>
  )
}
