import { DataTable } from '../../../shared/components/DataTable.tsx'
import { StatusChip } from '../../../shared/components/StatusChip.tsx'
import { useTranslation } from '../../../shared/i18n/languageContext.ts'
import { INVOICE_STATUS_KEYS } from '../invoiceStatusKeys.ts'
import type { StoredInvoice } from '../purchasingTypes.ts'

export function InvoiceList({ invoices }: { invoices: StoredInvoice[] }) {
  const { t, formatMonth, formatPersonDays } = useTranslation()

  if (invoices.length === 0) {
    return <p className="text-sm text-muted">{t('invoice.none')}</p>
  }

  return (
    <DataTable
      headers={[t('invoice.columnNumber'), t('purchasing.columnOrder'), t('invoice.month'), t('invoice.columnInvoiced'), t('invoice.approved'), t('invoice.difference'), t('purchasing.columnStatus')]}
    >
      {invoices.map((invoice) => (
        <tr key={invoice.id}>
          <td className="font-bold whitespace-nowrap">{invoice.invoiceNumber}</td>
          <td>
            <b className="whitespace-nowrap">{invoice.orderId}</b>
            <span className="block text-muted">{invoice.orderTitle}</span>
          </td>
          <td className="whitespace-nowrap">{formatMonth(invoice.month)}</td>
          <td className="whitespace-nowrap">{formatPersonDays(invoice.invoicedPersonDays)}</td>
          <td className="whitespace-nowrap">{formatPersonDays(invoice.approvedPersonDays)}</td>
          <td className="font-bold whitespace-nowrap">{`${invoice.differencePersonDays > 0 ? '+' : ''}${formatPersonDays(invoice.differencePersonDays)}`}</td>
          <td>
            <StatusChip tone={invoice.status === 'consistent' ? 'success' : 'signal'}>{t(INVOICE_STATUS_KEYS[invoice.status])}</StatusChip>
          </td>
        </tr>
      ))}
    </DataTable>
  )
}
