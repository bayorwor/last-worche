// Holds what the project lead's tabs share: the chosen order, its data and any error.
import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router'
import { useAppDispatch, useAppSelector } from '../../../app/storeHooks.ts'
import { Button } from '../../../shared/components/Button.tsx'
import { OrderSelect } from '../../../shared/components/OrderSelect.tsx'
import { PageTitle } from '../../../shared/components/PageTitle.tsx'
import { StatusMessage } from '../../../shared/components/StatusMessage.tsx'
import { useTranslation } from '../../../shared/i18n/languageContext.ts'
import { fetchOrders, loadOrder } from '../budgetSlice.ts'

export default function ProjectLeadDashboardPage() {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const { orders, error } = useAppSelector((state) => state.budget)
  const [chosenOrderId, setChosenOrderId] = useState<string | null>(null)
  const selectedOrderId = chosenOrderId ?? orders[0]?.id
  const selectedOrder = orders.find((order) => order.id === selectedOrderId)

  useEffect(() => {
    dispatch(fetchOrders())
  }, [dispatch])

  // Asks again whenever an order or tab is opened, so the figures always include the latest bookings.
  useEffect(() => {
    if (selectedOrderId) {
      dispatch(loadOrder(selectedOrderId))
    }
  }, [dispatch, selectedOrderId, pathname])

  function retry() {
    if (selectedOrderId) {
      dispatch(loadOrder(selectedOrderId))
    } else {
      dispatch(fetchOrders())
    }
  }

  return (
    <>
      <PageTitle>
        {selectedOrder
          ? t('budget.pageTitleForOrder', { orderId: selectedOrder.id, title: selectedOrder.title })
          : t('budget.pageTitle')}
      </PageTitle>
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
      <Outlet context={selectedOrderId} />
    </>
  )
}
