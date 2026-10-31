export type OrderBooking = {
  id: number
  consultantName: string
  date: string
  startTime: string
  endTime: string
  hours: number
  description: string
}

export type ProofOfWork = {
  month: string
  personDays: number
  bookingCount: number
  consultantCount: number
  status: 'open' | 'approved'
  approvedAtMs: number | null
  approvedByName: string | null
}

export type OrderBudget = {
  orderId: string
  orderedPersonDays: number
  usedPersonDays: number
  freePersonDays: number
}
