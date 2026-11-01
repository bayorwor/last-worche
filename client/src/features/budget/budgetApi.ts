import { apiClient } from '../../shared/api/apiClient.ts'
import type { OrderSummary } from '../../shared/api/orderSummary.ts'
import type { ForecastScenario, OrderBooking, OrderBudget, OrderForecast, ProofOfWork } from './budgetTypes.ts'

export async function requestOrders(): Promise<OrderSummary[]> {
  const { data } = await apiClient.get<OrderSummary[]>('/orders')
  return data
}

export async function requestOrderBookings(orderId: string): Promise<OrderBooking[]> {
  const { data } = await apiClient.get<OrderBooking[]>(`/orders/${encodeURIComponent(orderId)}/bookings`)
  return data
}

export async function requestProofsOfWork(orderId: string): Promise<ProofOfWork[]> {
  const { data } = await apiClient.get<ProofOfWork[]>(`/orders/${encodeURIComponent(orderId)}/proofs-of-work`)
  return data
}

export async function requestProofApproval(orderId: string, month: string): Promise<ProofOfWork[]> {
  const { data } = await apiClient.post<ProofOfWork[]>(`/orders/${encodeURIComponent(orderId)}/proofs-of-work/${month}/approve`)
  return data
}

export async function requestOrderBudget(orderId: string): Promise<OrderBudget> {
  const { data } = await apiClient.get<OrderBudget>(`/orders/${encodeURIComponent(orderId)}/budget`)
  return data
}

export async function requestOrderForecast(orderId: string, scenario: ForecastScenario = {}): Promise<OrderForecast> {
  const { data } = await apiClient.get<OrderForecast>(`/orders/${encodeURIComponent(orderId)}/forecast`, { params: scenario })
  return data
}

export async function requestFollowUpOrder(orderId: string, personDays: number, neededByDate: string): Promise<void> {
  await apiClient.post(`/orders/${encodeURIComponent(orderId)}/follow-up-requests`, { personDays, neededByDate })
}

export async function requestProofCsv(orderId: string, month: string): Promise<Blob> {
  const { data } = await apiClient.get<Blob>(`/orders/${encodeURIComponent(orderId)}/proofs-of-work/${month}/export.csv`, { responseType: 'blob' })
  return data
}
