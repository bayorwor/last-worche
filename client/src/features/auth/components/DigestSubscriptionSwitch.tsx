// A project lead's own choice to get the weekly email digest. It starts off, and only this switch turns it on:
// the server refuses any request that does not say so explicitly.
import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '../../../app/storeHooks.ts'
import { StatusMessage } from '../../../shared/components/StatusMessage.tsx'
import { useTranslation } from '../../../shared/i18n/languageContext.ts'
import { fetchDigestSubscription, saveDigestSubscription } from '../authSlice.ts'

export function DigestSubscriptionSwitch() {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()
  const { digestSubscribed, digestStatus, digestError } = useAppSelector((state) => state.auth)

  useEffect(() => {
    dispatch(fetchDigestSubscription())
  }, [dispatch])

  return (
    <div className="mt-4 border-t border-line pt-4">
      <label className="flex min-h-11 cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={digestSubscribed === true}
          disabled={digestSubscribed === null || digestStatus === 'loading'}
          onChange={(event) => dispatch(saveDigestSubscription(event.target.checked))}
          aria-describedby="digest-hint"
          className="mt-0.5 size-5 shrink-0 cursor-pointer accent-ink"
        />
        <span>
          <span className="block text-sm font-semibold">{t('profile.digestLabel')}</span>
          <span id="digest-hint" className="mt-1 block text-xs text-muted">
            {t('profile.digestHint')}
          </span>
        </span>
      </label>
      {digestError && (
        <StatusMessage tone="error" className="mt-3">
          {t(digestError.key, digestError.values)}
        </StatusMessage>
      )}
      {!digestError && digestStatus === 'succeeded' && (
        <StatusMessage tone="success" className="mt-3">
          {digestSubscribed ? t('profile.digestOn') : t('profile.digestOff')}
        </StatusMessage>
      )}
    </div>
  )
}
