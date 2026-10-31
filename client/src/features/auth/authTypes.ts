// Screens are built per role, so the client knows the role IDs. Everything else about a role comes from the backend.
export type UserRole = 'consultant' | 'project_lead' | 'purchasing'

export type Role = {
  id: UserRole
  names: { de: string; en: string }
  summaries: { de: string; en: string }
}

export type SessionUser = {
  id: string
  name: string
  email: string
  role: UserRole
  consultantId: string | null
}

export type SignInResponse = {
  token: string
  user: SessionUser
}

export type TestAccount = {
  email: string
  name: string
  role: UserRole
}

export type TestAccounts = {
  password: string
  accounts: TestAccount[]
}

export type Credentials = {
  email: string
  password: string
}
