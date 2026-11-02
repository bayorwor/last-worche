import { apiClient } from '../../shared/api/apiClient.ts'
import type { FollowUpRequest, FrameworkAgreement, InvoiceCheckResult, StoredInvoice, SupplierOverview } from './purchasingTypes.ts'

export type NewInvoice = { orderId: string; month: string; invoiceNumber: string; invoicedPersonDays: number }

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

export async function requestFollowUpDecline(id: number): Promise<FollowUpRequest[]> {
  const { data } = await apiClient.post<FollowUpRequest[]>(`/purchasing/follow-up-requests/${id}/decline`)
  return data
}

export async function requestFrameworkAgreements(): Promise<FrameworkAgreement[]> {
  const { data } = await apiClient.get<FrameworkAgreement[]>('/purchasing/framework-agreements')
  return data
}

export async function requestInvoices(): Promise<StoredInvoice[]> {
  const { data } = await apiClient.get<StoredInvoice[]>('/purchasing/invoices')
  return data
}

export async function requestInvoiceSave(invoice: NewInvoice): Promise<StoredInvoice[]> {
  const { data } = await apiClient.post<StoredInvoice[]>('/purchasing/invoices', invoice)
  return data
}

export async function requestInvoiceCheck(orderId: string, month: string, invoicedPersonDays: number): Promise<InvoiceCheckResult> {
  const { data } = await apiClient.post<InvoiceCheckResult>('/purchasing/invoice-check', { orderId, month, invoicedPersonDays })
  return data
}
