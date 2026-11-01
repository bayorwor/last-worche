// Compares a supplier's invoice with the approved proof of work, so nobody compares timesheets by hand.
import { useState, type FormEvent } from 'react'
import { useAppDispatch, useAppSelector } from '../../../app/storeHooks.ts'
import { Button } from '../../../shared/components/Button.tsx'
import { InfoNote } from '../../../shared/components/InfoNote.tsx'
import { MetricTile } from '../../../shared/components/MetricTile.tsx'
import { OrderSelect } from '../../../shared/components/OrderSelect.tsx'
import { Panel } from '../../../shared/components/Panel.tsx'
import { StatusChip } from '../../../shared/components/StatusChip.tsx'
import { StatusMessage } from '../../../shared/components/StatusMessage.tsx'
import { useTranslation } from '../../../shared/i18n/languageContext.ts'
import type { MessageKey } from '../../../shared/i18n/messages/de.ts'
import { todayIsoDate } from '../../../shared/utils/todayIsoDate.ts'
import { checkInvoice } from '../purchasingSlice.ts'
import type { InvoiceCheckResult } from '../purchasingTypes.ts'

const STATUS_KEYS: Record<InvoiceCheckResult['status'], MessageKey> = {
  consistent: 'invoice.statusConsistent',
  'over-approved': 'invoice.statusOver',
  'under-approved': 'invoice.statusUnder',
}

const INPUT_CLASSES = 'mt-2 min-h-11 w-full min-w-0 border border-ink bg-paper px-3.5 py-3 text-base'

export default function InvoiceCheckPage() {
  const dispatch = useAppDispatch()
  const { t, formatPersonDays } = useTranslation()
  const { suppliers, invoiceResult, invoiceStatus, invoiceError } = useAppSelector((state) => state.purchasing)
  const orders = suppliers.flatMap((supplier) => supplier.orders).map(({ orderId, title }) => ({ id: orderId, title }))
  const [chosenOrderId, setChosenOrderId] = useState<string | null>(null)
  const [month, setMonth] = useState(todayIsoDate().slice(0, 7))
  const [invoiced, setInvoiced] = useState('')
  const orderId = chosenOrderId ?? orders[0]?.id

  function submit(event: FormEvent) {
    event.preventDefault()
    if (orderId) {
      dispatch(checkInvoice({ orderId, month, invoicedPersonDays: Number(invoiced) }))
    }
  }

  const difference = invoiceResult?.differencePersonDays ?? 0

  return (
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
      {invoiceResult && (
        <div className="mt-4" role="status">
          <StatusChip tone={invoiceResult.status === 'consistent' ? 'success' : 'signal'}>{t(STATUS_KEYS[invoiceResult.status])}</StatusChip>
          <div className="mt-3 grid gap-px border border-line bg-line sm:grid-cols-3">
            <MetricTile label={t('invoice.approved')} value={formatPersonDays(invoiceResult.approvedPersonDays)} />
            <MetricTile label={t('invoice.invoiced')} value={formatPersonDays(invoiceResult.invoicedPersonDays)} />
            <MetricTile label={t('invoice.difference')} value={`${difference > 0 ? '+' : ''}${formatPersonDays(difference)}`} />
          </div>
        </div>
      )}
      <InfoNote>{t('invoice.note')}</InfoNote>
    </Panel>
  )
}
