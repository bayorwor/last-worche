import { useAppSelector } from '../../../app/storeHooks.ts'
import { PageLoader } from '../../../shared/components/PageLoader.tsx'
import { OrderBudgetPanel } from '../components/OrderBudgetPanel.tsx'
import { useSelectedOrderId } from '../useSelectedOrderId.ts'

export default function OrderBudgetPage() {
  const orderId = useSelectedOrderId()
  const { budgetsByOrderId, status } = useAppSelector((state) => state.budget)
  const budget = orderId ? budgetsByOrderId[orderId] : undefined

  if (budget) {
    return <OrderBudgetPanel budget={budget} />
  }
  return status === 'loading' ? <PageLoader /> : null
}
