import { PageTitle } from '../../../shared/components/PageTitle.tsx'
import { Panel } from '../../../shared/components/Panel.tsx'
import { StatusChip } from '../../../shared/components/StatusChip.tsx'
import { SupplierSummaryTable } from '../components/SupplierSummaryTable.tsx'
import { SAMPLE_SUPPLIER_SUMMARIES } from '../sampleSupplierSummaries.ts'

export default function PurchasingOverviewPage() {
  return (
    <>
      <PageTitle>Einkauf — Rahmensteuerung</PageTitle>
      <Panel
        title="Lieferantenübersicht — nur aggregierte Werte (Σ)"
        aside={<StatusChip tone="neutral">Beispieldaten</StatusChip>}
      >
        <SupplierSummaryTable suppliers={SAMPLE_SUPPLIER_SUMMARIES} />
      </Panel>
    </>
  )
}
