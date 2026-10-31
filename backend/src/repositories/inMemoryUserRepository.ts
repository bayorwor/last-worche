// A UserRepository that keeps data in memory, so unit tests run without a database.
import type { User } from "../domain/user.ts";
import type { UserRepository } from "./userRepository.ts";

export function createInMemoryUserRepository(users: User[]): UserRepository {
  return {
    listUsers: async () => users,
    findUser: async (userId) => users.find((user) => user.id === userId) ?? null,
  };
}
