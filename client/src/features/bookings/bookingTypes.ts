export type BookingProposal = {
  date: string
  startTime: string
  endTime: string
  hours: number
  description: string
}

export type Booking = BookingProposal & {
  id: number
  orderId: string
  consultantId: string
}
