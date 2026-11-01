import { useAppDispatch, useAppSelector } from '../../../app/storeHooks.ts'
import { PageLoader } from '../../../shared/components/PageLoader.tsx'
import { fetchOrderForecast, requestFollowUp } from '../budgetSlice.ts'
import { ForecastPanel } from '../components/ForecastPanel.tsx'
import { OrderBudgetPanel } from '../components/OrderBudgetPanel.tsx'
import { useSelectedOrderId } from '../useSelectedOrderId.ts'

export default function OrderBudgetPage() {
  const dispatch = useAppDispatch()
  const orderId = useSelectedOrderId()
  const { budgetsByOrderId, forecastsByOrderId, forecastStatus, forecastError, followUpStatus, status } = useAppSelector((state) => state.budget)
  const budget = orderId ? budgetsByOrderId[orderId] : undefined
  const forecast = orderId ? forecastsByOrderId[orderId] : undefined

  if (!budget || !orderId) {
    return status === 'loading' ? <PageLoader /> : null
  }
  return (
    <div className="grid gap-6">
      <OrderBudgetPanel budget={budget} />
      {forecast && (
        <ForecastPanel
          key={orderId}
          forecast={forecast}
          error={forecastError}
          isLoading={forecastStatus === 'loading'}
          isRequestingFollowUp={followUpStatus === 'loading'}
          onScenario={(scenario) => dispatch(fetchOrderForecast({ orderId, scenario }))}
          onResetScenario={() => dispatch(fetchOrderForecast({ orderId }))}
          onRequestFollowUp={(personDays, neededByDate) => dispatch(requestFollowUp({ orderId, personDays, neededByDate }))}
        />
      )}
    </div>
  )
}
