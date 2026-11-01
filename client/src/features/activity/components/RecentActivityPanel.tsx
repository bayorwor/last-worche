import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '../../../app/storeHooks.ts'
import { Button } from '../../../shared/components/Button.tsx'
import { Panel } from '../../../shared/components/Panel.tsx'
import { StatusMessage } from '../../../shared/components/StatusMessage.tsx'
import { useTranslation } from '../../../shared/i18n/languageContext.ts'
import type { MessageKey } from '../../../shared/i18n/messages/de.ts'
import { activityMessage } from '../activityMessage.ts'
import { fetchRecentActivity } from '../activitySlice.ts'
// scopeKey says what this role's list covers. The server decides what is really in it.
export function RecentActivityPanel({ scopeKey }: { scopeKey: MessageKey }) {
  const dispatch = useAppDispatch()
  const { t, formatDate, formatDateTime, formatHours, formatMonth, formatPersonDays } = useTranslation()
  const { entries, status, error } = useAppSelector((state) => state.activity)

  useEffect(() => {
    dispatch(fetchRecentActivity())
  }, [dispatch])

  return (
    <Panel title={t('activity.panelTitle')}>
      <p className="mb-4 text-xs text-muted">{t(scopeKey)}</p>
      {error && (
        <>
          <StatusMessage tone="error">{t(error.key, error.values)}</StatusMessage>
          <Button className="mt-3" onClick={() => dispatch(fetchRecentActivity())}>
            {t('common.retry')}
          </Button>
        </>
      )}
      {status === 'loading' && entries.length === 0 && <p className="text-sm text-muted">{t('common.loading')}</p>}
      {status === 'succeeded' && entries.length === 0 && <p className="text-sm text-muted">{t('activity.none')}</p>}
      <ul className="grid gap-3">
        {entries.map((entry) => {
          const { key, values } = activityMessage(entry, { formatDate, formatHours, formatMonth, formatPersonDays })
          return (
            <li key={entry.id} className="border-t border-line pt-3 text-sm first:border-t-0 first:pt-0">
              <p>{t(key, values)}</p>
              <p className="mt-0.5 text-xs text-muted tabular-nums">{formatDateTime(entry.occurredAtMs)}</p>
            </li>
          )
        })}
      </ul>
    </Panel>
  )
}
