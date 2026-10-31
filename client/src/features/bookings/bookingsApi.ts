import { apiClient } from '../../shared/api/apiClient.ts'
import { DEMO_CONSULTANT_ID, DEMO_ORDER_ID } from '../../shared/config/demoContext.ts'
import type { Booking, BookingProposal } from './bookingTypes.ts'

export async function requestBookingProposal(sentence: string): Promise<BookingProposal> {
  const { data } = await apiClient.post<BookingProposal>('/ai/parse-booking', { sentence })
  return data
}

export async function createBooking(proposal: BookingProposal): Promise<Booking> {
  const { data } = await apiClient.post<Booking>('/bookings', {
    ...proposal,
    orderId: DEMO_ORDER_ID,
    consultantId: DEMO_CONSULTANT_ID,
  })
  return data
}
