import { apiClient } from '../../shared/api/apiClient.ts'
import type { DemoUser, SessionUser, SignInResponse } from './authTypes.ts'

export async function requestDemoUsers(): Promise<DemoUser[]> {
  const { data } = await apiClient.get<DemoUser[]>('/auth/demo-users')
  return data
}

export async function requestSignIn(userId: string): Promise<SignInResponse> {
  const { data } = await apiClient.post<SignInResponse>('/auth/sign-in', { userId })
  return data
}

export async function requestCurrentUser(): Promise<SessionUser> {
  const { data } = await apiClient.get<SessionUser>('/auth/me')
  return data
}
