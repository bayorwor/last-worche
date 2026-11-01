import { apiClient } from '../../shared/api/apiClient.ts'
import type { Activity } from './activityTypes.ts'

export async function requestRecentActivity(): Promise<Activity[]> {
  const { data } = await apiClient.get<Activity[]>('/activity')
  return data
}
