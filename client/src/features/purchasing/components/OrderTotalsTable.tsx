import { DataTable } from '../../../shared/components/DataTable.tsx'
import { useTranslation } from '../../../shared/i18n/languageContext.ts'
import type { SupplierOverview } from '../purchasingTypes.ts'
import { FollowUpStatusChip } from './FollowUpStatusChip.tsx'

export function OrderTotalsTable({ suppliers }: { suppliers: SupplierOverview[] }) {
  const { t, formatPersonDays } = useTranslation()

  return (
    <DataTable
      headers={[
        t('purchasing.columnOrder'),
        t('purchasing.columnSupplier'),
        t('purchasing.columnOrdered'),
        t('purchasing.columnUsed'),
        t('purchasing.columnFree'),
        t('purchasing.columnStatus'),
      ]}
    >
      {suppliers.flatMap((supplier) =>
        supplier.orders.map((order) => (
          <tr key={order.orderId}>
            <td>
              <span className="block font-bold">{order.orderId}</span>
              <span className="block text-muted">{order.title}</span>
            </td>
            <td className="whitespace-nowrap">{supplier.supplierName}</td>
            <td className="whitespace-nowrap">{formatPersonDays(order.orderedPersonDays)}</td>
            <td className="whitespace-nowrap">{formatPersonDays(order.usedPersonDays)}</td>
            <td className="whitespace-nowrap">{formatPersonDays(order.freePersonDays)}</td>
            <td>
              <FollowUpStatusChip needsFollowUpOrder={order.needsFollowUpOrder} />
            </td>
          </tr>
        )),
      )}
    </DataTable>
  )
}
