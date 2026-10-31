import { apiClient } from '../../shared/api/apiClient.ts'
import type { OrderBudget } from './budgetTypes.ts'

export async function requestOrderBudget(orderId: string): Promise<OrderBudget> {
  const { data } = await apiClient.get<OrderBudget>(`/orders/${encodeURIComponent(orderId)}/budget`)
  return data
}
