// Compares a supplier's invoice with the approved proof of work, so nobody compares timesheets by hand, and
// stores it, so the difference stays on record. Saving only appears for the figures that were just checked.
import { useEffect, useState, type FormEvent } from 'react'
import { useAppDispatch, useAppSelector } from '../../../app/storeHooks.ts'
import { Button } from '../../../shared/components/Button.tsx'
import { InfoNote } from '../../../shared/components/InfoNote.tsx'
import { MetricTile } from '../../../shared/components/MetricTile.tsx'
import { OrderSelect } from '../../../shared/components/OrderSelect.tsx'
import { Panel } from '../../../shared/components/Panel.tsx'
import { StatusChip } from '../../../shared/components/StatusChip.tsx'
import { StatusMessage } from '../../../shared/components/StatusMessage.tsx'
import { useTranslation } from '../../../shared/i18n/languageContext.ts'
import { todayIsoDate } from '../../../shared/utils/todayIsoDate.ts'
import { InvoiceList } from '../components/InvoiceList.tsx'
import { INVOICE_STATUS_KEYS } from '../invoiceStatusKeys.ts'
import { checkInvoice, fetchInvoices, recordInvoice } from '../purchasingSlice.ts'

const INPUT_CLASSES = 'mt-2 min-h-11 w-full min-w-0 border border-ink bg-paper px-3.5 py-3 text-base'

export default function InvoiceCheckPage() {
  const dispatch = useAppDispatch()
  const { t, formatPersonDays } = useTranslation()
  const { suppliers, invoices, invoiceResult, invoiceStatus, invoiceError, invoiceSaveStatus } = useAppSelector((state) => state.purchasing)
  const orders = suppliers.flatMap((supplier) => supplier.orders).map(({ orderId, title }) => ({ id: orderId, title }))
  const [chosenOrderId, setChosenOrderId] = useState<string | null>(null)
  const [month, setMonth] = useState(todayIsoDate().slice(0, 7))
  const [invoiced, setInvoiced] = useState('')
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [checkedFigures, setCheckedFigures] = useState('')
  const orderId = chosenOrderId ?? orders[0]?.id
  const figures = `${orderId}|${month}|${invoiced}`

  useEffect(() => {
    dispatch(fetchInvoices())
  }, [dispatch])

  function submit(event: FormEvent) {
    event.preventDefault()
    if (orderId) {
      setCheckedFigures(figures)
      dispatch(checkInvoice({ orderId, month, invoicedPersonDays: Number(invoiced) }))
    }
  }

  async function save(event: FormEvent) {
    event.preventDefault()
    if (orderId) {
      const result = await dispatch(recordInvoice({ orderId, month, invoiceNumber: invoiceNumber.trim(), invoicedPersonDays: Number(invoiced) }))
      if (recordInvoice.fulfilled.match(result)) {
        setInvoiceNumber('')
      }
    }
  }

  const difference = invoiceResult?.differencePersonDays ?? 0

  return (
    <div className="grid gap-6">
      <Panel title={t('invoice.panelTitle')}>
        <form onSubmit={submit}>
          <div className="grid gap-4 sm:grid-cols-[2fr_1fr_1fr]">
            {orderId && <OrderSelect id="invoice-order" orders={orders} selectedOrderId={orderId} onChange={setChosenOrderId} />}
            <div>
              <label htmlFor="invoice-month" className="block text-sm font-semibold">{t('invoice.month')}</label>
              <input id="invoice-month" type="month" value={month} onChange={(event) => setMonth(event.target.value)} className={INPUT_CLASSES} />
            </div>
            <div>
              <label htmlFor="invoice-person-days" className="block text-sm font-semibold">{t('invoice.invoiced')}</label>
              <input id="invoice-person-days" type="number" inputMode="decimal" min={0} step={0.001} value={invoiced} onChange={(event) => setInvoiced(event.target.value)} className={INPUT_CLASSES} />
            </div>
          </div>
          <Button type="submit" className="mt-3" disabled={invoiced === '' || invoiceStatus === 'loading'}>
            {t('invoice.check')}
          </Button>
        </form>
        {invoiceError && (
          <StatusMessage tone="error" className="mt-4">
            {t(invoiceError.key, invoiceError.values)}
          </StatusMessage>
        )}
        {invoiceSaveStatus === 'succeeded' && (
          <StatusMessage tone="success" className="mt-4">
            {t('invoice.saved')}
          </StatusMessage>
        )}
        {invoiceResult && (
          <div className="mt-4" role="status">
            <StatusChip tone={invoiceResult.status === 'consistent' ? 'success' : 'signal'}>{t(INVOICE_STATUS_KEYS[invoiceResult.status])}</StatusChip>
            <div className="mt-3 grid gap-px border border-line bg-line sm:grid-cols-3">
              <MetricTile label={t('invoice.approved')} value={formatPersonDays(invoiceResult.approvedPersonDays)} />
              <MetricTile label={t('invoice.invoiced')} value={formatPersonDays(invoiceResult.invoicedPersonDays)} />
              <MetricTile label={t('invoice.difference')} value={`${difference > 0 ? '+' : ''}${formatPersonDays(difference)}`} />
            </div>
          </div>
        )}
        {invoiceResult && checkedFigures === figures && (
          <form onSubmit={save} className="mt-4 flex flex-wrap items-end gap-3">
            <div className="min-w-56 flex-1">
              <label htmlFor="invoice-number" className="block text-sm font-semibold">{t('invoice.number')}</label>
              <input id="invoice-number" type="text" maxLength={64} value={invoiceNumber} onChange={(event) => setInvoiceNumber(event.target.value)} className={INPUT_CLASSES} />
            </div>
            <Button type="submit" disabled={invoiceNumber.trim() === '' || invoiceSaveStatus === 'loading'}>
              {t('invoice.save')}
            </Button>
          </form>
        )}
        <InfoNote>{t('invoice.note')}</InfoNote>
      </Panel>
      <Panel title={t('invoice.listTitle')}>
        <InvoiceList invoices={invoices} />
      </Panel>
    </div>
  )
}
