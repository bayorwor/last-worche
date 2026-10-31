import { DataTable } from '../../../shared/components/DataTable.tsx'
import { StatusChip } from '../../../shared/components/StatusChip.tsx'
import { formatPersonDays } from '../../../shared/utils/formatters.ts'
import type { SupplierSummary } from '../sampleSupplierSummaries.ts'

export function SupplierSummaryTable({ suppliers }: { suppliers: SupplierSummary[] }) {
  return (
    <DataTable headers={['Lieferant', 'Aufträge', 'Verbraucht', 'Frei', 'Status']}>
      {suppliers.map((supplier) => (
        <tr key={supplier.supplierName}>
          <td className="font-bold">{supplier.supplierName}</td>
          <td>{supplier.orderCount}</td>
          <td>{formatPersonDays(supplier.usedPersonDays)}</td>
          <td>{formatPersonDays(supplier.freePersonDays)}</td>
          <td>
            {supplier.needsFollowUpOrder ? (
              <StatusChip tone="signal">Nachtrag nötig</StatusChip>
            ) : (
              <StatusChip tone="success">Im Plan</StatusChip>
            )}
          </td>
        </tr>
      ))}
    </DataTable>
  )
}
