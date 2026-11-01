// Requests from project leads for more budget. Confirming means purchasing has placed the follow-up order,
// which raises the order's budget, and declining closes the request. Both take a second click.
import { useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from '../../../app/storeHooks.ts'
import { Button } from '../../../shared/components/Button.tsx'
import { DataTable } from '../../../shared/components/DataTable.tsx'
import { Panel } from '../../../shared/components/Panel.tsx'
import { StatusChip } from '../../../shared/components/StatusChip.tsx'
import { StatusMessage } from '../../../shared/components/StatusMessage.tsx'
import { useTranslation } from '../../../shared/i18n/languageContext.ts'
import type { MessageKey } from '../../../shared/i18n/messages/de.ts'
import { confirmFollowUp, declineFollowUp, fetchFollowUps } from '../purchasingSlice.ts'
import type { FollowUpRequest } from '../purchasingTypes.ts'

const STATUS_KEYS: Record<FollowUpRequest['status'], MessageKey> = {
  open: 'followUp.statusOpen',
  confirmed: 'followUp.statusConfirmed',
  declined: 'followUp.statusDeclined',
}

const STATUS_TONES = { open: 'signal', confirmed: 'success', declined: 'neutral' } as const

type PendingDecision = { id: number; action: 'confirm' | 'decline' }

export default function FollowUpRequestsPage() {
  const dispatch = useAppDispatch()
  const { t, formatDate, formatPersonDays } = useTranslation()
  const { followUps, followUpStatus, followUpError } = useAppSelector((state) => state.purchasing)
  const [pending, setPending] = useState<PendingDecision | null>(null)

  useEffect(() => {
    dispatch(fetchFollowUps())
  }, [dispatch])

  function decide({ id, action }: PendingDecision) {
    setPending(null)
    dispatch(action === 'confirm' ? confirmFollowUp(id) : declineFollowUp(id))
  }

  return (
    <Panel title={t('followUp.panelTitle')}>
      {followUpError && (
        <StatusMessage tone="error" className="mb-4">
          {t(followUpError.key, followUpError.values)}
        </StatusMessage>
      )}
      {followUps.length === 0 ? (
        <p className="text-sm text-muted">{t('followUp.none')}</p>
      ) : (
        <DataTable headers={[t('purchasing.columnOrder'), t('followUp.columnPersonDays'), t('followUp.columnNeededBy'), t('purchasing.columnStatus'), '']}>
          {followUps.map((request) => (
            <tr key={request.id}>
              <td>
                <b className="whitespace-nowrap">{request.orderId}</b>
                <span className="block text-muted">{request.orderTitle}</span>
              </td>
              <td className="font-bold whitespace-nowrap">{formatPersonDays(request.personDays)}</td>
              <td className="whitespace-nowrap">{formatDate(request.neededByDate)}</td>
              <td>
                <StatusChip tone={STATUS_TONES[request.status]}>{t(STATUS_KEYS[request.status])}</StatusChip>
              </td>
              <td>
                {request.status === 'open' &&
                  (pending?.id === request.id ? (
                    <div className="flex flex-wrap gap-2">
                      <Button variant="signal" disabled={followUpStatus === 'loading'} onClick={() => decide(pending)}>
                        {t(pending.action === 'confirm' ? 'followUp.confirmYes' : 'followUp.declineYes')}
                      </Button>
                      <Button variant="ghost" onClick={() => setPending(null)}>
                        {t('budget.proofCancel')}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      <Button variant="ghost" disabled={followUpStatus === 'loading'} onClick={() => setPending({ id: request.id, action: 'confirm' })}>
                        {t('followUp.confirm')}
                      </Button>
                      <Button variant="ghost" disabled={followUpStatus === 'loading'} onClick={() => setPending({ id: request.id, action: 'decline' })}>
                        {t('followUp.decline')}
                      </Button>
                    </div>
                  ))}
              </td>
            </tr>
          ))}
        </DataTable>
      )}
    </Panel>
  )
}
