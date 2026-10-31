import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '../../../app/storeHooks.ts'
import { Button } from '../../../shared/components/Button.tsx'
import { PageLoader } from '../../../shared/components/PageLoader.tsx'
import { PageTitle } from '../../../shared/components/PageTitle.tsx'
import { StatusMessage } from '../../../shared/components/StatusMessage.tsx'
import { DEMO_ORDER_ID } from '../../../shared/config/demoContext.ts'
import { fetchOrderBudget } from '../budgetSlice.ts'
import { OrderBudgetPanel } from '../components/OrderBudgetPanel.tsx'

export default function ProjectLeadDashboardPage() {
  const dispatch = useAppDispatch()
  const { orderBudget, status, errorMessage } = useAppSelector((state) => state.budget)

  useEffect(() => {
    dispatch(fetchOrderBudget(DEMO_ORDER_ID))
  }, [dispatch])

  return (
    <>
      <PageTitle>Projektleitung — Auftrag {DEMO_ORDER_ID}</PageTitle>
      {errorMessage && (
        <div className="mb-6 max-w-xl">
          <StatusMessage tone="error">{errorMessage}</StatusMessage>
          <Button className="mt-3" onClick={() => dispatch(fetchOrderBudget(DEMO_ORDER_ID))}>
            Erneut versuchen
          </Button>
        </div>
      )}
      {orderBudget ? <OrderBudgetPanel budget={orderBudget} /> : status === 'loading' && <PageLoader />}
    </>
  )
}
