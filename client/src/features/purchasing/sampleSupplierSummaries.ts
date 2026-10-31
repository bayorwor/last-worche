// Sample values from the mockup, until the backend offers an aggregated supplier endpoint.
export type SupplierSummary = {
  supplierName: string
  orderCount: number
  usedPersonDays: number
  freePersonDays: number
  needsFollowUpOrder: boolean
}

export const SAMPLE_SUPPLIER_SUMMARIES: SupplierSummary[] = [
  { supplierName: 'Consultis GmbH', orderCount: 3, usedPersonDays: 84.9, freePersonDays: 55.1, needsFollowUpOrder: true },
  { supplierName: 'Nordlicht Agentur', orderCount: 2, usedPersonDays: 46.2, freePersonDays: 73.8, needsFollowUpOrder: false },
  { supplierName: 'Freelance Pool', orderCount: 1, usedPersonDays: 12, freePersonDays: 8, needsFollowUpOrder: true },
]
