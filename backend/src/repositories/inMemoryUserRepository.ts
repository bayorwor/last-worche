// A UserRepository that keeps data in memory, so unit tests run without a database.
import type { Role } from "../domain/user.ts";
import type { UserAccount, UserRepository } from "./userRepository.ts";

export function createInMemoryUserRepository(accounts: UserAccount[], roles: Role[] = []): UserRepository {
  return {
    listRoles: async () => roles,
    listUsers: async () => accounts.map(({ passwordHash: _passwordHash, ...user }) => user),
    findAccountByEmail: async (email) => accounts.find((account) => account.email === email) ?? null,
  };
}
