import { useAppSelector } from '../../../app/storeHooks.ts'
import { InfoNote } from '../../../shared/components/InfoNote.tsx'
import { Panel } from '../../../shared/components/Panel.tsx'
import { StatusChip } from '../../../shared/components/StatusChip.tsx'
import { useTranslation } from '../../../shared/i18n/languageContext.ts'
import { SupplierSummaryTable } from '../components/SupplierSummaryTable.tsx'

export default function SupplierTotalsPage() {
  const { t } = useTranslation()
  const suppliers = useAppSelector((state) => state.purchasing.suppliers)

  return (
    <Panel title={t('purchasing.panelTitle')} aside={<StatusChip tone="neutral">{t('purchasing.personalDataHidden')}</StatusChip>}>
      <SupplierSummaryTable suppliers={suppliers} />
      <InfoNote>{t('purchasing.privacyNote')}</InfoNote>
    </Panel>
  )
}
