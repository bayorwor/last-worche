import { useAppSelector } from '../../../app/storeHooks.ts'
import { OrderBookingsTable } from '../components/OrderBookingsTable.tsx'
import { useSelectedOrderId } from '../useSelectedOrderId.ts'

export default function OrderBookingsPage() {
  const orderId = useSelectedOrderId()
  const bookingsByOrderId = useAppSelector((state) => state.budget.bookingsByOrderId)
  const bookings = orderId ? bookingsByOrderId[orderId] : undefined

  return orderId && bookings ? <OrderBookingsTable orderId={orderId} bookings={bookings} /> : null
}
