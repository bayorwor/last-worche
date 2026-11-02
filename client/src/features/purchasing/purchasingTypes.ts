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
  status: 'open' | 'confirmed' | 'declined'
}

export type InvoiceCheckResult = {
  status: 'consistent' | 'over-approved' | 'under-approved'
  approvedPersonDays: number
  invoicedPersonDays: number
  differencePersonDays: number
}

export type StoredInvoice = InvoiceCheckResult & {
  id: number
  orderId: string
  orderTitle: string
  month: string
  invoiceNumber: string
  recordedAtMs: number
}

export type FrameworkAgreement = {
  id: string
  title: string
  supplierName: string
  totalPersonDays: number
  orderedPersonDays: number
  freePersonDays: number
  usedPersonDays: number
  orders: { orderId: string; title: string; orderedPersonDays: number; usedPersonDays: number }[]
}
