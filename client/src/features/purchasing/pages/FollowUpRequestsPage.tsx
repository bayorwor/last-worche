// Requests from project leads for more budget. Confirming means purchasing has placed the follow-up order,
// which raises the order's budget, so it takes a second click.
import { useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from '../../../app/storeHooks.ts'
import { Button } from '../../../shared/components/Button.tsx'
import { DataTable } from '../../../shared/components/DataTable.tsx'
import { Panel } from '../../../shared/components/Panel.tsx'
import { StatusChip } from '../../../shared/components/StatusChip.tsx'
import { useTranslation } from '../../../shared/i18n/languageContext.ts'
import { confirmFollowUp, fetchFollowUps } from '../purchasingSlice.ts'

export default function FollowUpRequestsPage() {
  const dispatch = useAppDispatch()
  const { t, formatDate, formatPersonDays } = useTranslation()
  const { followUps, followUpStatus } = useAppSelector((state) => state.purchasing)
  const [confirmingId, setConfirmingId] = useState<number | null>(null)

  useEffect(() => {
    dispatch(fetchFollowUps())
  }, [dispatch])

  return (
    <Panel title={t('followUp.panelTitle')}>
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
                <StatusChip tone={request.status === 'open' ? 'signal' : 'success'}>
                  {request.status === 'open' ? t('followUp.statusOpen') : t('followUp.statusConfirmed')}
                </StatusChip>
              </td>
              <td>
                {request.status === 'open' &&
                  (confirmingId === request.id ? (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="signal"
                        disabled={followUpStatus === 'loading'}
                        onClick={() => {
                          setConfirmingId(null)
                          dispatch(confirmFollowUp(request.id))
                        }}
                      >
                        {t('followUp.confirmYes')}
                      </Button>
                      <Button variant="ghost" onClick={() => setConfirmingId(null)}>
                        {t('budget.proofCancel')}
                      </Button>
                    </div>
                  ) : (
                    <Button variant="ghost" disabled={followUpStatus === 'loading'} onClick={() => setConfirmingId(request.id)}>
                      {t('followUp.confirm')}
                    </Button>
                  ))}
              </td>
            </tr>
          ))}
        </DataTable>
      )}
    </Panel>
  )
}
