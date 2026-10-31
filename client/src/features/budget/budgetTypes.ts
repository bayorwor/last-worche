export type OrderBooking = {
  id: number
  consultantName: string
  date: string
  startTime: string
  endTime: string
  hours: number
  description: string
}

export type OrderBudget = {
  orderId: string
  orderedPersonDays: number
  usedPersonDays: number
  freePersonDays: number
}
