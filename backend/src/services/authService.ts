// Sign-in with a one-time code sent by email (ADR-0014). A correct code earns a signed session token,
// and the signature lets the server trust that token on later requests.
import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import jwt from "jsonwebtoken";
import { NotFoundError, UnauthorizedError } from "../domain/errors.ts";
import { USER_ROLES, type User, type UserRole } from "../domain/user.ts";
import type { ActivityRepository } from "../repositories/activityRepository.ts";
import type { UserRepository } from "../repositories/userRepository.ts";
import { buildSignInCodeEmail, type EmailLanguage } from "../templates/signInCodeEmail.ts";
import type { Email } from "./emailService.ts";

const SESSION_LIFETIME = "8h";
const SIGNING_ALGORITHM = "HS256";

export const CODE_VALID_MINUTES = 10;
export const CODE_RESEND_WAIT_SECONDS = 60;
export const CODE_MAX_ATTEMPTS = 5;

type AuthOptions = {
  sessionSecret: string;
  // True only when no real email is sent. Testers then receive the code in the response, because the
  // seeded addresses have no mailbox. A real email address must never get its code this way.
  showCodes: boolean;
  testAccountsEnabled: boolean;
  sendEmail: (email: Email) => Promise<void>;
  activities: Pick<ActivityRepository, "record">;
  now?: () => number;
};

export type AuthService = ReturnType<typeof createAuthService>;

export function createAuthService(users: UserRepository, options: AuthOptions) {
  const { sessionSecret, showCodes, testAccountsEnabled, sendEmail, activities, now = Date.now } = options;

  // Keyed with the server's secret, because six digits alone are quick to guess from a stolen hash.
  function hashCode(userId: string, code: string) {
    return createHmac("sha256", sessionSecret).update(`${userId}:${code}`).digest("hex");
  }

  function isSameHash(first: string, second: string) {
    return timingSafeEqual(Buffer.from(first), Buffer.from(second));
  }

  function recordAccountActivity(type: "signed_in" | "profile_updated", userId: string) {
    return activities.record({ type, actorUserId: userId, occurredAtMs: now(), orderId: null, period: null, hours: null });
  }

  // The token holds the name from when it was issued, so the database decides what the profile shows.
  async function getProfile(userId: string) {
    const user = await users.findUserById(userId);
    if (!user) throw new UnauthorizedError("Please sign in again.");
    return user;
  }

  function createSession(user: User) {
    const { id, ...claims } = user;
    const token = jwt.sign(claims, sessionSecret, {
      subject: id,
      expiresIn: SESSION_LIFETIME,
      algorithm: SIGNING_ALGORITHM,
    });
    return { token, user };
  }

  return {
    listRoles() {
      return users.listRoles();
    },

    async listTestAccounts() {
      if (!testAccountsEnabled) throw new NotFoundError("Test accounts are switched off.");

      const allUsers = await users.listUsers();
      return allUsers.map(({ email, name, role }) => ({ email, name, role }));
    },

    // Answers the same for an unknown email, so nobody can test which addresses have an account.
    async requestCode(email: string, language: EmailLanguage): Promise<{ testCode?: string }> {
      const user = await users.findUserByEmail(email);
      if (!user) return {};

      const existingCode = await users.findSignInCode(user.id);
      const isTooSoon = existingCode && now() - existingCode.createdAtMs < CODE_RESEND_WAIT_SECONDS * 1000;
      if (isTooSoon && !showCodes) return {};

      const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
      await users.saveSignInCode({
        userId: user.id,
        codeHash: hashCode(user.id, code),
        createdAtMs: now(),
        expiresAtMs: now() + CODE_VALID_MINUTES * 60 * 1000,
      });

      // Not awaited: waiting for the mail server would show from the response time that this email exists.
      sendEmail({ to: user.email, ...buildSignInCodeEmail(code, CODE_VALID_MINUTES, language) }).catch((error) => {
        console.error("Sending a sign-in code failed:", error);
      });

      return showCodes ? { testCode: code } : {};
    },

    async verifyCode(email: string, code: string) {
      const invalidCode = new UnauthorizedError("The code is wrong or has expired.", "invalid-code");

      const user = await users.findUserByEmail(email);
      if (!user) throw invalidCode;

      const stored = await users.findSignInCode(user.id);
      if (!stored || stored.expiresAtMs <= now()) throw invalidCode;

      // Counted before comparing, so that simultaneous guesses cannot get past the limit.
      if (!(await users.registerCodeAttempt(stored.id, CODE_MAX_ATTEMPTS))) throw invalidCode;
      if (!isSameHash(hashCode(user.id, code), stored.codeHash)) throw invalidCode;

      // Only the request that really removes the code may sign in, so a code works exactly once.
      if (!(await users.deleteSignInCode(stored.id))) throw invalidCode;

      await recordAccountActivity("signed_in", user.id);
      return createSession(user);
    },

    getProfile,

    // The user comes from the session, so nobody can change another person's profile.
    async updateProfile(userId: string, name: string) {
      const user = await getProfile(userId);
      if (user.name === name) return user;

      await users.updateUserName(userId, name);
      await recordAccountActivity("profile_updated", userId);
      return getProfile(userId);
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
