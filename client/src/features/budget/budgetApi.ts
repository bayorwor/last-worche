import { apiClient } from '../../shared/api/apiClient.ts'
import type { OrderSummary } from '../../shared/api/orderSummary.ts'
import type { OrderBooking, OrderBudget, ProofOfWork } from './budgetTypes.ts'

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
