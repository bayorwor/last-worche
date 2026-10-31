import { useTranslation } from '../i18n/languageContext.ts'
import type { OrderSummary } from '../api/orderSummary.ts'

type OrderSelectProps = {
  id: string
  orders: OrderSummary[]
  selectedOrderId: string
  className?: string
  onChange: (orderId: string) => void
}

export function OrderSelect({ id, orders, selectedOrderId, className = '', onChange }: OrderSelectProps) {
  const { t } = useTranslation()

  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-semibold">
        {t('orders.selectLabel')}
      </label>
      <select
        id={id}
        value={selectedOrderId}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 min-h-11 w-full cursor-pointer border border-ink bg-paper px-3.5 py-3 text-base"
      >
        {orders.map((order) => (
          <option key={order.id} value={order.id}>
            {order.id} · {order.title}
          </option>
        ))}
      </select>
    </div>
  )
}
