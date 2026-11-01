import { apiClient } from '../../shared/api/apiClient.ts'
import type { FollowUpRequest, InvoiceCheckResult, SupplierOverview } from './purchasingTypes.ts'

export async function requestSupplierOverview(): Promise<SupplierOverview[]> {
  const { data } = await apiClient.get<SupplierOverview[]>('/purchasing/supplier-overview')
  return data
}

export async function requestFollowUpRequests(): Promise<FollowUpRequest[]> {
  const { data } = await apiClient.get<FollowUpRequest[]>('/purchasing/follow-up-requests')
  return data
}

export async function requestFollowUpConfirmation(id: number): Promise<FollowUpRequest[]> {
  const { data } = await apiClient.post<FollowUpRequest[]>(`/purchasing/follow-up-requests/${id}/confirm`)
  return data
}

export async function requestInvoiceCheck(orderId: string, month: string, invoicedPersonDays: number): Promise<InvoiceCheckResult> {
  const { data } = await apiClient.post<InvoiceCheckResult>('/purchasing/invoice-check', { orderId, month, invoicedPersonDays })
  return data
}
