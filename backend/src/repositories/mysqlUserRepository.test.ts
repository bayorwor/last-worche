// Runs against a real MySQL database, and only when TEST_DATABASE_URL is set.
import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import type { Pool } from "mysql2/promise";
import { UnauthorizedError } from "../domain/errors.ts";
import { createAuthService, type AuthService } from "../services/authService.ts";
import { openDatabase } from "./database.ts";
import { createMysqlUserRepository } from "./mysqlUserRepository.ts";
import { DEMO_PROJECT_LEAD_ID, ROLES, TEST_USERS } from "./seedData.ts";

const databaseUrl = process.env.TEST_DATABASE_URL;
const EMAIL = "a.weber@client.example";

describe.skipIf(!databaseUrl)("mysqlUserRepository", () => {
  let db: Pool;
  let service: AuthService;

  async function requestCode() {
    return (await service.requestCode(EMAIL, "en")).testCode as string;
  }

  beforeAll(async () => {
    db = await openDatabase(databaseUrl as string);
    service = createAuthService(createMysqlUserRepository(db), {
      sessionSecret: "test-secret",
      showCodes: true,
      testAccountsEnabled: true,
      sendEmail: async () => {},
    });
  });

  beforeEach(async () => {
    await db.query("DELETE FROM sign_in_codes");
  });

  afterAll(async () => {
    await db.end();
  });

  test("seeds every role and test user, without any password column", async () => {
    expect((await service.listRoles()).map((role) => role.id)).toEqual(ROLES.map((role) => role.id) as never);
    expect((await service.listTestAccounts()).map((account) => account.email).sort()).toEqual(
      TEST_USERS.map((user) => user.email).sort(),
    );
    const [columns] = await db.query("SHOW COLUMNS FROM users LIKE 'password_hash'");
    expect(columns).toEqual([]);
  });

  test("a correct code signs in once and is gone afterwards", async () => {
    const code = await requestCode();

    const { user } = await service.verifyCode(EMAIL, code);

    expect(user.id).toBe(DEMO_PROJECT_LEAD_ID);
    await expect(service.verifyCode(EMAIL, code)).rejects.toThrow(UnauthorizedError);
  });

  test("only stores a hash of the code", async () => {
    const code = await requestCode();

    const [rows] = await db.query("SELECT code_hash FROM sign_in_codes");

    expect(JSON.stringify(rows)).not.toContain(code);
  });

  test("the same code used at the same moment signs in only once", async () => {
    const code = await requestCode();

    const results = await Promise.allSettled(Array.from({ length: 5 }, () => service.verifyCode(EMAIL, code)));

    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
  });

  test("simultaneous guesses cannot get past the limit of attempts", async () => {
    const code = await requestCode();
    const wrongCode = code === "000000" ? "111111" : "000000";

    await Promise.allSettled(Array.from({ length: 20 }, () => service.verifyCode(EMAIL, wrongCode)));

    await expect(service.verifyCode(EMAIL, code)).rejects.toThrow(UnauthorizedError);
  });

  test("a new code replaces the old one", async () => {
    const firstCode = await requestCode();
    const secondCode = await requestCode();

    if (firstCode !== secondCode) {
      await expect(service.verifyCode(EMAIL, firstCode)).rejects.toThrow(UnauthorizedError);
    }
    expect((await service.verifyCode(EMAIL, secondCode)).user.email).toBe(EMAIL);
  });
});
