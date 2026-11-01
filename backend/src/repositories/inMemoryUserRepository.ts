// A UserRepository that keeps data in memory, so unit tests run without a database.
import type { Role, User } from "../domain/user.ts";
import type { SignInCode, UserRepository } from "./userRepository.ts";

export function createInMemoryUserRepository(users: User[], roles: Role[] = []): UserRepository {
  const codes = new Map<string, SignInCode & { attempts: number }>();
  let lastCodeId = 0;

  const findById = (codeId: number) => [...codes.values()].find((code) => code.id === codeId);

  return {
    listRoles: async () => roles,
    listUsers: async () => users,
    findUserByEmail: async (email) => users.find((user) => user.email === email) ?? null,
    findUserById: async (userId) => users.find((user) => user.id === userId) ?? null,
    updateUserName: async (userId, name) => {
      const user = users.find(({ id }) => id === userId);
      if (user) user.name = name;
    },
    saveSignInCode: async (code) => {
      lastCodeId += 1;
      codes.set(code.userId, { ...code, id: lastCodeId, attempts: 0 });
    },
    findSignInCode: async (userId) => codes.get(userId) ?? null,
    registerCodeAttempt: async (codeId, maxAttempts) => {
      const code = findById(codeId);
      if (!code || code.attempts >= maxAttempts) return false;
      code.attempts += 1;
      return true;
    },
    deleteSignInCode: async (codeId) => {
      const code = findById(codeId);
      return code ? codes.delete(code.userId) : false;
    },
  };
}
