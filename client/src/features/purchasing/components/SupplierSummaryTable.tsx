import { DataTable } from '../../../shared/components/DataTable.tsx'
import { useTranslation } from '../../../shared/i18n/languageContext.ts'
import type { SupplierOverview } from '../purchasingTypes.ts'
import { FollowUpStatusChip } from './FollowUpStatusChip.tsx'

export function SupplierSummaryTable({ suppliers }: { suppliers: SupplierOverview[] }) {
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
          <td className="font-bold whitespace-nowrap">{supplier.supplierName}</td>
          <td>{supplier.orderCount}</td>
          <td className="whitespace-nowrap">{formatPersonDays(supplier.usedPersonDays)}</td>
          <td className="whitespace-nowrap">{formatPersonDays(supplier.freePersonDays)}</td>
          <td>
            <FollowUpStatusChip needsFollowUpOrder={supplier.needsFollowUpOrder} />
          </td>
        </tr>
      ))}
    </DataTable>
  )
}
