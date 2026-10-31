export type UserRole = 'consultant' | 'project_lead' | 'purchasing'

export type DemoUser = {
  id: string
  name: string
  role: UserRole
}

export type SessionUser = DemoUser & {
  consultantId: string | null
}

export type SignInResponse = {
  token: string
  user: SessionUser
}
