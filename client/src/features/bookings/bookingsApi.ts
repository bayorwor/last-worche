import { apiClient } from '../../shared/api/apiClient.ts'
import type { OrderSummary } from '../../shared/api/orderSummary.ts'
import { todayIsoDate } from '../../shared/utils/todayIsoDate.ts'
import type { Booking, BookingCheckResult, BookingProposal } from './bookingTypes.ts'

export async function requestAssignedOrders(): Promise<OrderSummary[]> {
  const { data } = await apiClient.get<OrderSummary[]>('/orders')
  return data
}

export async function requestOwnBookings(consultantId: string): Promise<Booking[]> {
  const { data } = await apiClient.get<Booking[]>(`/consultants/${encodeURIComponent(consultantId)}/bookings`)
  return data
}

export async function requestBookingProposal(sentence: string): Promise<BookingProposal> {
  const { data } = await apiClient.post<BookingProposal>('/ai/parse-booking', { sentence, today: todayIsoDate() })
  return data
}

export async function requestBookingCheck(proposal: BookingProposal, orderId: string): Promise<BookingCheckResult> {
  const { data } = await apiClient.post<BookingCheckResult>('/bookings/check', { ...proposal, orderId })
  return data
}

export async function createBooking(proposal: BookingProposal, orderId: string): Promise<Booking> {
  const { data } = await apiClient.post<Booking>('/bookings', { ...proposal, orderId })
  return data
}
