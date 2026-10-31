import { apiClient } from '../../shared/api/apiClient.ts'
import type { SupplierOverview } from './purchasingTypes.ts'

export async function requestSupplierOverview(): Promise<SupplierOverview[]> {
  const { data } = await apiClient.get<SupplierOverview[]>('/purchasing/supplier-overview')
  return data
}
