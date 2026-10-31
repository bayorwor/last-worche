import { apiClient } from '../../shared/api/apiClient.ts'
import type { OrderSummary } from '../../shared/api/orderSummary.ts'
import type { OrderBudget } from './budgetTypes.ts'

export async function requestOrders(): Promise<OrderSummary[]> {
  const { data } = await apiClient.get<OrderSummary[]>('/orders')
  return data
}

export async function requestOrderBudget(orderId: string): Promise<OrderBudget> {
  const { data } = await apiClient.get<OrderBudget>(`/orders/${encodeURIComponent(orderId)}/budget`)
  return data
}
