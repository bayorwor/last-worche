// Sign-in with email and password (ADR-0013). Passwords are only stored as hashes. A correct password
// earns a signed session token, and the signature lets the server trust that token on later requests.
import jwt from "jsonwebtoken";
import { NotFoundError, UnauthorizedError } from "../domain/errors.ts";
import { USER_ROLES, type User, type UserRole } from "../domain/user.ts";
import type { UserRepository } from "../repositories/userRepository.ts";

const SESSION_LIFETIME = "8h";
const SIGNING_ALGORITHM = "HS256";

type AuthOptions = {
  sessionSecret: string;
  // The shared password of the seeded test accounts, or null to hide the list of test accounts.
  testAccountPassword: string | null;
};

export type AuthService = ReturnType<typeof createAuthService>;

export function createAuthService(users: UserRepository, { sessionSecret, testAccountPassword }: AuthOptions) {
  // Checked when an email is unknown, so that a wrong email takes as long as a wrong password
  // and the response time does not reveal which emails exist.
  const hashForUnknownEmail = Bun.password.hash(crypto.randomUUID());

  return {
    listRoles() {
      return users.listRoles();
    },

    async listTestAccounts() {
      if (testAccountPassword === null) throw new NotFoundError("Test accounts are switched off.");

      const allUsers = await users.listUsers();
      return {
        password: testAccountPassword,
        accounts: allUsers.map(({ email, name, role }) => ({ email, name, role })),
      };
    },

    async signIn(email: string, password: string) {
      const account = await users.findAccountByEmail(email);
      const isCorrect = await Bun.password.verify(password, account?.passwordHash ?? (await hashForUnknownEmail));
      if (!account || !isCorrect) {
        throw new UnauthorizedError("The email or password is wrong.", "invalid-credentials");
      }

      const { id, passwordHash: _passwordHash, ...claims } = account;
      const token = jwt.sign(claims, sessionSecret, {
        subject: id,
        expiresIn: SESSION_LIFETIME,
        algorithm: SIGNING_ALGORITHM,
      });
      return { token, user: { id, ...claims } };
    },

    // Throws for a token that was changed, has expired or was signed with another secret.
    verifySessionToken(token: string): User {
      try {
        const claims = jwt.verify(token, sessionSecret, { algorithms: [SIGNING_ALGORITHM] });
        if (typeof claims === "string" || !claims.sub || !USER_ROLES.includes(claims.role as UserRole)) {
          throw new Error("Unexpected token content");
        }
        return {
          id: claims.sub,
          name: claims.name,
          email: claims.email,
          role: claims.role,
          consultantId: claims.consultantId ?? null,
        };
      } catch {
        throw new UnauthorizedError("Please sign in again.");
      }
    },
  };
}
