// What the sign-in needs from storage. Services depend on this type, not on MySQL.
import type { Role, User } from "../domain/user.ts";

export type NewSignInCode = {
  userId: string;
  codeHash: string;
  createdAtMs: number;
  expiresAtMs: number;
};

export type SignInCode = NewSignInCode & {
  id: number;
};

export type UserRepository = {
  listRoles(): Promise<Role[]>;
  listUsers(): Promise<User[]>;
  findUserByEmail(email: string): Promise<User | null>;
  findUserById(userId: string): Promise<User | null>;
  // Also renames the linked consultant, because project leads see that name on bookings.
  updateUserName(userId: string, name: string): Promise<void>;
  // A user has at most one code: saving a new one replaces the old one and its attempts.
  saveSignInCode(code: NewSignInCode): Promise<void>;
  findSignInCode(userId: string): Promise<SignInCode | null>;
  // Both return false when another request got there first, so they stay correct under simultaneous requests.
  registerCodeAttempt(codeId: number, maxAttempts: number): Promise<boolean>;
  deleteSignInCode(codeId: number): Promise<boolean>;
};
