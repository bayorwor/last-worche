export type BookingProposal = {
  date: string
  startTime: string
  endTime: string
  hours: number
  description: string
  // Set when the sentence clearly names one of the person's orders.
  suggestedOrderId?: string | null
}

export type Booking = BookingProposal & {
  id: number
  orderId: string
  consultantId: string
}

export type BookingRuleCheck = {
  name: string
  passed: boolean
  rule?: string
  values?: Record<string, string | number>
  message?: string
}

// The server's answer to "what would happen if I saved this?". Nothing has been stored.
export type BookingCheckResult = {
  checks: BookingRuleCheck[]
  freePersonDaysAfter: number
  suggestedSlot: { startTime: string; endTime: string } | null
}
