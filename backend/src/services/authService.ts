// The demo sign-in from ADR-0002: choose a seeded user, receive a signed session token. There is no
// password in the demo. The signature means the server can trust the token's content on later requests.
import jwt from "jsonwebtoken";
import { UnauthorizedError } from "../domain/errors.ts";
import { USER_ROLES, type User, type UserRole } from "../domain/user.ts";
import type { UserRepository } from "../repositories/userRepository.ts";

const SESSION_LIFETIME = "8h";
const SIGNING_ALGORITHM = "HS256";

export type AuthService = ReturnType<typeof createAuthService>;

export function createAuthService(users: UserRepository, sessionSecret: string) {
  return {
    async listDemoUsers() {
      const allUsers = await users.listUsers();
      return allUsers.map(({ id, name, role }) => ({ id, name, role }));
    },

    async signIn(userId: string) {
      const user = await users.findUser(userId);
      if (!user) throw new UnauthorizedError(`There is no demo user ${userId}.`);

      const { id, ...claims } = user;
      const token = jwt.sign(claims, sessionSecret, {
        subject: id,
        expiresIn: SESSION_LIFETIME,
        algorithm: SIGNING_ALGORITHM,
      });
      return { token, user };
    },

    // Throws for a token that was changed, has expired or was signed with another secret.
    verifySessionToken(token: string): User {
      try {
        const claims = jwt.verify(token, sessionSecret, { algorithms: [SIGNING_ALGORITHM] });
        if (typeof claims === "string" || !claims.sub || !USER_ROLES.includes(claims.role as UserRole)) {
          throw new Error("Unexpected token content");
        }
        return { id: claims.sub, name: claims.name, role: claims.role, consultantId: claims.consultantId ?? null };
      } catch {
        throw new UnauthorizedError("Please sign in again.");
      }
    },
  };
}
