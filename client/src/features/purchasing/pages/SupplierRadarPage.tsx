// How many unusual booking patterns each supplier has. Counts only: the server refuses purchasing the
// order radar, which names people and days, and sends nothing more than these numbers here.
import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '../../../app/storeHooks.ts'
import { DataTable } from '../../../shared/components/DataTable.tsx'
import { InfoNote } from '../../../shared/components/InfoNote.tsx'
import { Panel } from '../../../shared/components/Panel.tsx'
import { StatusChip } from '../../../shared/components/StatusChip.tsx'
import { useTranslation } from '../../../shared/i18n/languageContext.ts'
import { fetchSupplierRadar } from '../purchasingSlice.ts'

export default function SupplierRadarPage() {
  const dispatch = useAppDispatch()
  const { t, formatDate } = useTranslation()
  const supplierRadar = useAppSelector((state) => state.purchasing.supplierRadar)

  useEffect(() => {
    dispatch(fetchSupplierRadar())
  }, [dispatch])

  if (!supplierRadar) return null

  return (
    <Panel
      title={t('radar.supplierPanelTitle')}
      aside={<StatusChip tone="neutral">{t('purchasing.personalDataHidden')}</StatusChip>}
    >
      <p className="mb-3 text-sm text-muted">{t('radar.evaluatedOn', { date: formatDate(supplierRadar.evaluatedOn) })}</p>
      <DataTable
        headers={[
          t('purchasing.columnSupplier'),
          t('radar.columnLongDays'),
          t('radar.columnWeekend'),
          t('radar.columnPaceJump'),
          t('radar.columnJustUnder'),
        ]}
      >
        {supplierRadar.suppliers.map((supplier) => (
          <tr key={supplier.supplierName}>
            <td className="font-bold whitespace-nowrap">{supplier.supplierName}</td>
            {[supplier.frequentLongDays, supplier.weekendWork, supplier.paceJumps, supplier.justUnderLimit].map((count, index) => (
              <td key={index} className={count > 0 ? 'font-bold' : 'text-muted'}>
                {count}
              </td>
            ))}
          </tr>
        ))}
      </DataTable>
      <InfoNote>{t('radar.supplierNote')}</InfoNote>
    </Panel>
  )
}
