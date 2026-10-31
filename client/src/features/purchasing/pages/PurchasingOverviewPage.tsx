import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '../../../app/storeHooks.ts'
import { Button } from '../../../shared/components/Button.tsx'
import { InfoNote } from '../../../shared/components/InfoNote.tsx'
import { MetricTile } from '../../../shared/components/MetricTile.tsx'
import { PageLoader } from '../../../shared/components/PageLoader.tsx'
import { PageTitle } from '../../../shared/components/PageTitle.tsx'
import { Panel } from '../../../shared/components/Panel.tsx'
import { StatusChip } from '../../../shared/components/StatusChip.tsx'
import { StatusMessage } from '../../../shared/components/StatusMessage.tsx'
import { useTranslation } from '../../../shared/i18n/languageContext.ts'
import { OrderTotalsTable } from '../components/OrderTotalsTable.tsx'
import { SupplierSummaryTable } from '../components/SupplierSummaryTable.tsx'
import { fetchSupplierOverview } from '../purchasingSlice.ts'

export default function PurchasingOverviewPage() {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()
  const { suppliers, status, error } = useAppSelector((state) => state.purchasing)

  useEffect(() => {
    dispatch(fetchSupplierOverview())
  }, [dispatch])

  const orders = suppliers.flatMap((supplier) => supplier.orders)
  const orderedPersonDays = orders.reduce((total, order) => total + order.orderedPersonDays, 0)
  const usedPersonDays = orders.reduce((total, order) => total + order.usedPersonDays, 0)
  const usedPercent = orderedPersonDays > 0 ? Math.round((usedPersonDays / orderedPersonDays) * 100) : 0
  const followUpCount = orders.filter((order) => order.needsFollowUpOrder).length

  return (
    <>
      <PageTitle>{t('purchasing.pageTitle')}</PageTitle>
      {error && (
        <div className="mb-6 max-w-xl">
          <StatusMessage tone="error">{t(error.key, error.values)}</StatusMessage>
          <Button className="mt-3" onClick={() => dispatch(fetchSupplierOverview())}>
            {t('common.retry')}
          </Button>
        </div>
      )}
      {status === 'loading' && suppliers.length === 0 && <PageLoader />}
      {suppliers.length > 0 && (
        <div className="grid gap-6">
          <Panel
            title={t('purchasing.panelTitle')}
            aside={<StatusChip tone="neutral">{t('purchasing.personalDataHidden')}</StatusChip>}
          >
            <SupplierSummaryTable suppliers={suppliers} />
            <InfoNote>{t('purchasing.privacyNote')}</InfoNote>
          </Panel>
          <Panel title={t('purchasing.ordersPanelTitle')}>
            <OrderTotalsTable suppliers={suppliers} />
          </Panel>
          <Panel title={t('purchasing.steeringPanelTitle')}>
            <div className="grid gap-px border border-line bg-line sm:grid-cols-3">
              <MetricTile label={t('purchasing.metricFollowUps')} value={String(followUpCount)} />
              <MetricTile label={t('purchasing.metricOrders')} value={String(orders.length)} />
              <MetricTile label={t('purchasing.metricBudgetUsed')} value={`${usedPercent} %`} />
            </div>
          </Panel>
        </div>
      )}
    </>
  )
}
