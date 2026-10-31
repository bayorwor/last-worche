// Who is using the system. Permission checks only see this, so replacing the demo sign-in
// with single sign-on does not change them (ADR-0002).
export const USER_ROLES = ["consultant", "project_lead", "purchasing"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export type User = {
  id: string;
  name: string;
  role: UserRole;
  consultantId: string | null; // only set for the consultant role
};
