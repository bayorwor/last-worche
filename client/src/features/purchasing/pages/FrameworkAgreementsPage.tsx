// What each framework agreement has left. An order's budget reserves part of the agreement, so "free" is
// what follow-up orders can still use. Totals only: the server sends no person and no day here.
import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '../../../app/storeHooks.ts'
import { DataTable } from '../../../shared/components/DataTable.tsx'
import { InfoNote } from '../../../shared/components/InfoNote.tsx'
import { MetricTile } from '../../../shared/components/MetricTile.tsx'
import { Panel } from '../../../shared/components/Panel.tsx'
import { StatusChip } from '../../../shared/components/StatusChip.tsx'
import { useTranslation } from '../../../shared/i18n/languageContext.ts'
import { fetchFrameworkAgreements } from '../purchasingSlice.ts'

export default function FrameworkAgreementsPage() {
  const dispatch = useAppDispatch()
  const { t, formatPersonDays } = useTranslation()
  const frameworkAgreements = useAppSelector((state) => state.purchasing.frameworkAgreements)

  useEffect(() => {
    dispatch(fetchFrameworkAgreements())
  }, [dispatch])

  return (
    <div className="grid gap-6">
      {frameworkAgreements.map((agreement) => (
        <Panel key={agreement.id} title={`${agreement.title} (${agreement.id})`} aside={<StatusChip tone="neutral">{agreement.supplierName}</StatusChip>}>
          <div className="grid gap-px border border-line bg-line sm:grid-cols-4">
            <MetricTile label={t('framework.total')} value={formatPersonDays(agreement.totalPersonDays)} />
            <MetricTile label={t('framework.reserved')} value={formatPersonDays(agreement.orderedPersonDays)} />
            <MetricTile label={t('framework.free')} value={formatPersonDays(agreement.freePersonDays)} />
            <MetricTile label={t('framework.used')} value={formatPersonDays(agreement.usedPersonDays)} />
          </div>
          <div className="mt-4">
            <DataTable headers={[t('purchasing.columnOrder'), t('framework.columnReserved'), t('purchasing.columnUsed')]}>
              {agreement.orders.map((order) => (
                <tr key={order.orderId}>
                  <td>
                    <b className="whitespace-nowrap">{order.orderId}</b>
                    <span className="block text-muted">{order.title}</span>
                  </td>
                  <td className="whitespace-nowrap">{formatPersonDays(order.orderedPersonDays)}</td>
                  <td className="whitespace-nowrap">{formatPersonDays(order.usedPersonDays)}</td>
                </tr>
              ))}
            </DataTable>
          </div>
        </Panel>
      ))}
      <InfoNote>{t('framework.note')}</InfoNote>
    </div>
  )
}
