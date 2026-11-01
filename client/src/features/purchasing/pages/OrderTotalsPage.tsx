import { useAppSelector } from '../../../app/storeHooks.ts'
import { Panel } from '../../../shared/components/Panel.tsx'
import { useTranslation } from '../../../shared/i18n/languageContext.ts'
import { OrderTotalsTable } from '../components/OrderTotalsTable.tsx'

export default function OrderTotalsPage() {
  const { t } = useTranslation()
  const suppliers = useAppSelector((state) => state.purchasing.suppliers)

  return (
    <Panel title={t('purchasing.ordersPanelTitle')}>
      <OrderTotalsTable suppliers={suppliers} />
    </Panel>
  )
}
