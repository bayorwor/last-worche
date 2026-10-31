import { DataTable } from '../../../shared/components/DataTable.tsx'
import { StatusChip } from '../../../shared/components/StatusChip.tsx'
import { useTranslation } from '../../../shared/i18n/languageContext.ts'
import type { SupplierSummary } from '../sampleSupplierSummaries.ts'

export function SupplierSummaryTable({ suppliers }: { suppliers: SupplierSummary[] }) {
  const { t, formatPersonDays } = useTranslation()

  return (
    <DataTable
      headers={[
        t('purchasing.columnSupplier'),
        t('purchasing.columnOrders'),
        t('purchasing.columnUsed'),
        t('purchasing.columnFree'),
        t('purchasing.columnStatus'),
      ]}
    >
      {suppliers.map((supplier) => (
        <tr key={supplier.supplierName}>
          <td className="font-bold">{supplier.supplierName}</td>
          <td>{supplier.orderCount}</td>
          <td>{formatPersonDays(supplier.usedPersonDays)}</td>
          <td>{formatPersonDays(supplier.freePersonDays)}</td>
          <td>
            {supplier.needsFollowUpOrder ? (
              <StatusChip tone="signal">{t('purchasing.followUpNeeded')}</StatusChip>
            ) : (
              <StatusChip tone="success">{t('purchasing.onTrack')}</StatusChip>
            )}
          </td>
        </tr>
      ))}
    </DataTable>
  )
}
