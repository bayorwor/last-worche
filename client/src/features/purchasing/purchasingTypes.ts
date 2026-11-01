export type OrderOverview = {
  orderId: string
  title: string
  orderedPersonDays: number
  usedPersonDays: number
  freePersonDays: number
  needsFollowUpOrder: boolean
}

export type SupplierOverview = {
  supplierName: string
  orderCount: number
  orderedPersonDays: number
  usedPersonDays: number
  freePersonDays: number
  needsFollowUpOrder: boolean
  orders: OrderOverview[]
}

export type FollowUpRequest = {
  id: number
  orderId: string
  orderTitle: string
  personDays: number
  neededByDate: string
  status: 'open' | 'confirmed'
}
