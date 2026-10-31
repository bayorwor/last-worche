import { describe, expect, test } from "bun:test";
import jwt from "jsonwebtoken";
import { UnauthorizedError } from "../domain/errors.ts";
import type { User } from "../domain/user.ts";
import { createInMemoryUserRepository } from "../repositories/inMemoryUserRepository.ts";
import { createAuthService } from "./authService.ts";

const SECRET = "test-secret";
const consultant: User = { id: "user-consultant", name: "L. Hoffmann", role: "consultant", consultantId: "consultant-1" };
const service = createAuthService(createInMemoryUserRepository([consultant]), SECRET);

describe("authService", () => {
  test("lists demo users without their consultant ID", async () => {
    expect(await service.listDemoUsers()).toEqual([{ id: "user-consultant", name: "L. Hoffmann", role: "consultant" }]);
  });

  test("a signed-in user's token gives back the same user", async () => {
    const { token } = await service.signIn("user-consultant");

    expect(service.verifySessionToken(token)).toEqual(consultant);
  });

  test("rejects signing in as an unknown user", async () => {
    await expect(service.signIn("nobody")).rejects.toThrow(UnauthorizedError);
  });

  test("rejects a token whose content was changed", async () => {
    const { token } = await service.signIn("user-consultant");
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
