// Who is using the system. Permission checks only see this, so replacing the password sign-in
// with single sign-on does not change them (ADR-0002, ADR-0013).
export const USER_ROLES = ["consultant", "project_lead", "purchasing"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  consultantId: string | null; // only set for the consultant role
};

// A role's name and description come from the database. What a role may do is decided by the
// route guards in code, so a new role also needs new permission checks.
export type Role = {
  id: UserRole;
  names: { de: string; en: string };
  summaries: { de: string; en: string };
};
