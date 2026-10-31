import { apiClient } from '../../shared/api/apiClient.ts'
import type { Language } from '../../shared/i18n/languages.ts'
import type { RequestCodeResponse, Role, SessionUser, SignInResponse, TestAccount } from './authTypes.ts'

export async function requestRoles(): Promise<Role[]> {
  const { data } = await apiClient.get<Role[]>('/auth/roles')
  return data
}

export async function requestTestAccounts(): Promise<TestAccount[]> {
  const { data } = await apiClient.get<TestAccount[]>('/auth/test-accounts')
  return data
}

export async function requestSignInCode(email: string, language: Language): Promise<RequestCodeResponse> {
  const { data } = await apiClient.post<RequestCodeResponse>('/auth/request-code', { email, language })
  return data
}

export async function requestCodeVerification(email: string, code: string): Promise<SignInResponse> {
  const { data } = await apiClient.post<SignInResponse>('/auth/verify-code', { email, code })
  return data
}

export async function requestCurrentUser(): Promise<SessionUser> {
  const { data } = await apiClient.get<SessionUser>('/auth/me')
  return data
}
