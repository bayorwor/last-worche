import { PageTitle } from '../../../shared/components/PageTitle.tsx'
import { Panel } from '../../../shared/components/Panel.tsx'
import { StatusChip } from '../../../shared/components/StatusChip.tsx'
import { useTranslation } from '../../../shared/i18n/languageContext.ts'
import { SupplierSummaryTable } from '../components/SupplierSummaryTable.tsx'
import { SAMPLE_SUPPLIER_SUMMARIES } from '../sampleSupplierSummaries.ts'

export default function PurchasingOverviewPage() {
  const { t } = useTranslation()

  return (
    <>
      <PageTitle>{t('purchasing.pageTitle')}</PageTitle>
      <Panel
        title={t('purchasing.panelTitle')}
        aside={<StatusChip tone="neutral">{t('purchasing.sampleData')}</StatusChip>}
      >
        <SupplierSummaryTable suppliers={SAMPLE_SUPPLIER_SUMMARIES} />
      </Panel>
    </>
  )
}
