import { describe, expect, test } from "bun:test";
import jwt from "jsonwebtoken";
import { NotFoundError, UnauthorizedError } from "../domain/errors.ts";
import { createInMemoryUserRepository } from "../repositories/inMemoryUserRepository.ts";
import type { UserAccount } from "../repositories/userRepository.ts";
import { createAuthService } from "./authService.ts";

const SECRET = "test-secret";
const PASSWORD = "correct-password";

const account: UserAccount = {
  id: "user-consultant",
  name: "L. Hoffmann",
  email: "l.hoffmann@consultis.example",
  role: "consultant",
  consultantId: "consultant-1",
  // Low cost, so the tests stay fast.
  passwordHash: Bun.password.hashSync(PASSWORD, { algorithm: "bcrypt", cost: 4 }),
};
const { passwordHash: _passwordHash, ...user } = account;

const repository = createInMemoryUserRepository([account]);
const service = createAuthService(repository, { sessionSecret: SECRET, testAccountPassword: "test-password" });

describe("signIn", () => {
  test("accepts the correct password, and returns the user without the hash", async () => {
    const result = await service.signIn(account.email, PASSWORD);

    expect(result.user).toEqual(user);
    expect(JSON.stringify(result)).not.toContain(account.passwordHash);
  });

  test("rejects a wrong password", async () => {
    await expect(service.signIn(account.email, "wrong")).rejects.toThrow(UnauthorizedError);
  });

  test("gives the same error for an unknown email and a wrong password", async () => {
    const unknownEmail = await service.signIn("nobody@example.com", PASSWORD).catch((error) => error);
    const wrongPassword = await service.signIn(account.email, "wrong").catch((error) => error);

    expect(unknownEmail.message).toBe(wrongPassword.message);
    expect(unknownEmail.code).toBe("invalid-credentials");
  });
});

describe("listTestAccounts", () => {
  test("lists the accounts and their shared password", async () => {
    expect(await service.listTestAccounts()).toEqual({
      password: "test-password",
      accounts: [{ email: account.email, name: "L. Hoffmann", role: "consultant" }],
    });
  });

  test("is not available when switched off", async () => {
    const closed = createAuthService(repository, { sessionSecret: SECRET, testAccountPassword: null });

    await expect(closed.listTestAccounts()).rejects.toThrow(NotFoundError);
  });
});

describe("verifySessionToken", () => {
  test("a token gives back the same user", async () => {
    const { token } = await service.signIn(account.email, PASSWORD);

    expect(service.verifySessionToken(token)).toEqual(user);
  });

  test("rejects a token whose content was changed", async () => {
    const { token } = await service.signIn(account.email, PASSWORD);
    const [header, , signature] = token.split(".");
    const forgedClaims = Buffer.from(JSON.stringify({ sub: "user-purchasing", role: "purchasing" })).toString("base64url");

    expect(() => service.verifySessionToken(`${header}.${forgedClaims}.${signature}`)).toThrow(UnauthorizedError);
  });

  test("rejects a token signed with another secret", () => {
    const token = jwt.sign({ role: "purchasing" }, "another-secret", { subject: "user-purchasing" });

    expect(() => service.verifySessionToken(token)).toThrow(UnauthorizedError);
  });

  test("rejects an expired token", () => {
    const token = jwt.sign({ role: "consultant" }, SECRET, { subject: "user-consultant", expiresIn: -1 });

    expect(() => service.verifySessionToken(token)).toThrow(UnauthorizedError);
  });

  test("rejects an unsigned token", () => {
    const token = jwt.sign({ role: "consultant" }, "", { subject: "user-consultant", algorithm: "none" });

    expect(() => service.verifySessionToken(token)).toThrow(UnauthorizedError);
  });
});
