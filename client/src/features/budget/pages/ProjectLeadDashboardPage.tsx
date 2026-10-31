import { useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from '../../../app/storeHooks.ts'
import { Button } from '../../../shared/components/Button.tsx'
import { OrderSelect } from '../../../shared/components/OrderSelect.tsx'
import { PageLoader } from '../../../shared/components/PageLoader.tsx'
import { PageTitle } from '../../../shared/components/PageTitle.tsx'
import { StatusMessage } from '../../../shared/components/StatusMessage.tsx'
import { useTranslation } from '../../../shared/i18n/languageContext.ts'
import { fetchOrderBookings, fetchOrderBudget, fetchOrders } from '../budgetSlice.ts'
import { OrderBookingsTable } from '../components/OrderBookingsTable.tsx'
import { OrderBudgetPanel } from '../components/OrderBudgetPanel.tsx'

export default function ProjectLeadDashboardPage() {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()
  const { orders, budgetsByOrderId, bookingsByOrderId, status, error } = useAppSelector((state) => state.budget)
  const [chosenOrderId, setChosenOrderId] = useState<string | null>(null)
  const selectedOrderId = chosenOrderId ?? orders[0]?.id
  const selectedBudget = selectedOrderId ? budgetsByOrderId[selectedOrderId] : undefined
  const selectedBookings = selectedOrderId ? bookingsByOrderId[selectedOrderId] : undefined

  useEffect(() => {
    dispatch(fetchOrders())
  }, [dispatch])

  // Asks again every time an order is opened, so the figures always include the latest bookings.
  useEffect(() => {
    if (selectedOrderId) {
      dispatch(fetchOrderBudget(selectedOrderId))
      dispatch(fetchOrderBookings(selectedOrderId))
    }
  }, [dispatch, selectedOrderId])

  function retry() {
    if (selectedOrderId) {
      dispatch(fetchOrderBudget(selectedOrderId))
      dispatch(fetchOrderBookings(selectedOrderId))
    } else {
      dispatch(fetchOrders())
    }
  }

  return (
    <>
      <PageTitle>{t('budget.pageTitle')}</PageTitle>
      {selectedOrderId && (
        <OrderSelect
          id="budget-order"
          className="mb-6 max-w-xl"
          orders={orders}
          selectedOrderId={selectedOrderId}
          onChange={setChosenOrderId}
        />
      )}
      {error && (
        <div className="mb-6 max-w-xl">
          <StatusMessage tone="error">{t(error.key, error.values)}</StatusMessage>
          <Button className="mt-3" onClick={retry}>
            {t('common.retry')}
          </Button>
        </div>
      )}
      <div className="grid gap-6">
        {selectedBudget ? <OrderBudgetPanel budget={selectedBudget} /> : status === 'loading' && <PageLoader />}
        {selectedOrderId && selectedBookings && <OrderBookingsTable orderId={selectedOrderId} bookings={selectedBookings} />}
      </div>
    </>
  )
}
