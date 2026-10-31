// What the sign-in needs from storage. Services depend on this type, not on MySQL.
import type { Role, User } from "../domain/user.ts";

// The password hash stays inside the sign-in. Only a plain User ever leaves the service.
export type UserAccount = User & { passwordHash: string };

export type UserRepository = {
  listRoles(): Promise<Role[]>;
  listUsers(): Promise<User[]>;
  findAccountByEmail(email: string): Promise<UserAccount | null>;
};
