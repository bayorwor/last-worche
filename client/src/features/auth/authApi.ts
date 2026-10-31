import { apiClient } from '../../shared/api/apiClient.ts'
import type { Credentials, Role, SessionUser, SignInResponse, TestAccounts } from './authTypes.ts'

export async function requestRoles(): Promise<Role[]> {
  const { data } = await apiClient.get<Role[]>('/auth/roles')
  return data
}

export async function requestTestAccounts(): Promise<TestAccounts> {
  const { data } = await apiClient.get<TestAccounts>('/auth/test-accounts')
  return data
}

export async function requestSignIn(credentials: Credentials): Promise<SignInResponse> {
  const { data } = await apiClient.post<SignInResponse>('/auth/sign-in', credentials)
  return data
}

export async function requestCurrentUser(): Promise<SessionUser> {
  const { data } = await apiClient.get<SessionUser>('/auth/me')
  return data
}
