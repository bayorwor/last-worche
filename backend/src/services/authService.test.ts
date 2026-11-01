import { describe, expect, test } from "bun:test";
import jwt from "jsonwebtoken";
import { NotFoundError, UnauthorizedError } from "../domain/errors.ts";
import type { User } from "../domain/user.ts";
import { createInMemoryActivityRepository } from "../repositories/inMemoryActivityRepository.ts";
import { createInMemoryUserRepository } from "../repositories/inMemoryUserRepository.ts";
import { CODE_MAX_ATTEMPTS, CODE_RESEND_WAIT_SECONDS, CODE_VALID_MINUTES, createAuthService } from "./authService.ts";
import type { Email } from "./emailService.ts";

const SECRET = "test-secret";
const EMAIL = "l.hoffmann@consultis.example";

const user: User = { id: "user-consultant", name: "L. Hoffmann", email: EMAIL, role: "consultant", consultantId: "consultant-1" };

function setUp({ showCodes = false, testAccountsEnabled = true } = {}) {
  const sentEmails: Email[] = [];
  const clock = { time: 1_000_000 };
  const users = [{ ...user }];
  const activities = createInMemoryActivityRepository(users);
  const service = createAuthService(createInMemoryUserRepository(users), {
    sessionSecret: SECRET,
    showCodes,
    testAccountsEnabled,
    sendEmail: async (email) => {
      sentEmails.push(email);
    },
    activities,
    now: () => clock.time,
  });
  const codeFromEmail = (email = sentEmails.at(-1)) => email?.text.match(/\d{6}/)?.[0] as string;
  return { service, sentEmails, clock, codeFromEmail, activities };
}

const otherCode = (code: string) => (code === "000000" ? "000001" : "000000");

describe("requestCode", () => {
  test("emails a 6-digit code and keeps it out of the response when real email is on", async () => {
    const { service, sentEmails, codeFromEmail } = setUp();

    const response = await service.requestCode(EMAIL, "en");

    expect(response).toEqual({});
    expect(sentEmails).toHaveLength(1);
    expect(sentEmails[0]?.to).toBe(EMAIL);
    expect(codeFromEmail()).toMatch(/^\d{6}$/);
  });

  test("shows the code in the response only in test mode", async () => {
    const { service, codeFromEmail } = setUp({ showCodes: true });

    expect(await service.requestCode(EMAIL, "en")).toEqual({ testCode: codeFromEmail() });
  });

  test("writes the email in the chosen language", async () => {
    const { service, sentEmails } = setUp();

    await service.requestCode(EMAIL, "de");

    expect(sentEmails[0]?.subject).toBe("Ihr lastWorche-Anmeldecode");
  });

  test("answers the same for an unknown email, and sends nothing", async () => {
    const { service, sentEmails } = setUp();

    expect(await service.requestCode("nobody@example.com", "en")).toEqual({});
    expect(sentEmails).toHaveLength(0);
  });

  test("does not send a second email within the waiting time", async () => {
    const { service, sentEmails, clock } = setUp();

    await service.requestCode(EMAIL, "en");
    clock.time += (CODE_RESEND_WAIT_SECONDS - 1) * 1000;
    await service.requestCode(EMAIL, "en");
    expect(sentEmails).toHaveLength(1);

    clock.time += 1000;
    await service.requestCode(EMAIL, "en");
    expect(sentEmails).toHaveLength(2);
  });

  test("still answers normally when sending the email fails", async () => {
    const service = createAuthService(createInMemoryUserRepository([user]), {
      sessionSecret: SECRET,
      showCodes: false,
      testAccountsEnabled: true,
      sendEmail: () => Promise.reject(new Error("Mail server down")),
      activities: createInMemoryActivityRepository(),
    });
    const originalError = console.error;
    console.error = () => {};

    expect(await service.requestCode(EMAIL, "en")).toEqual({});
    await Bun.sleep(0);
    console.error = originalError;
  });
});

describe("verifyCode", () => {
  test("accepts the correct code and returns a session for that user", async () => {
    const { service, codeFromEmail } = setUp();
    await service.requestCode(EMAIL, "en");

    const { token, user: signedIn } = await service.verifyCode(EMAIL, codeFromEmail());

    expect(signedIn).toEqual(user);
    expect(service.verifySessionToken(token)).toEqual(user);
  });

  test("rejects a wrong code, and the right one still works afterwards", async () => {
    const { service, codeFromEmail } = setUp();
    await service.requestCode(EMAIL, "en");

    await expect(service.verifyCode(EMAIL, otherCode(codeFromEmail()))).rejects.toThrow(UnauthorizedError);
    expect((await service.verifyCode(EMAIL, codeFromEmail())).user).toEqual(user);
  });

  test("a code works only once", async () => {
    const { service, codeFromEmail } = setUp();
    await service.requestCode(EMAIL, "en");
    await service.verifyCode(EMAIL, codeFromEmail());

    await expect(service.verifyCode(EMAIL, codeFromEmail())).rejects.toThrow(UnauthorizedError);
  });

  test("accepts a code just before it expires, and rejects it at the expiry time", async () => {
    const { service, clock, codeFromEmail } = setUp();
    await service.requestCode(EMAIL, "en");
    const code = codeFromEmail();

    clock.time += CODE_VALID_MINUTES * 60 * 1000;

    await expect(service.verifyCode(EMAIL, code)).rejects.toThrow(UnauthorizedError);

    clock.time -= 1;
    expect((await service.verifyCode(EMAIL, code)).user).toEqual(user);
  });

  test("blocks a code after too many wrong attempts, even with the right one", async () => {
    const { service, codeFromEmail } = setUp();
    await service.requestCode(EMAIL, "en");
    const code = codeFromEmail();

    for (let attempt = 0; attempt < CODE_MAX_ATTEMPTS; attempt += 1) {
      await expect(service.verifyCode(EMAIL, otherCode(code))).rejects.toThrow(UnauthorizedError);
    }

    await expect(service.verifyCode(EMAIL, code)).rejects.toThrow(UnauthorizedError);
  });

  test("a new code replaces the old one", async () => {
    const { service, clock, sentEmails, codeFromEmail } = setUp();
    await service.requestCode(EMAIL, "en");
    clock.time += CODE_RESEND_WAIT_SECONDS * 1000;
    await service.requestCode(EMAIL, "en");
    const [firstCode, secondCode] = sentEmails.map((email) => codeFromEmail(email)) as [string, string];

    if (firstCode !== secondCode) {
      await expect(service.verifyCode(EMAIL, firstCode)).rejects.toThrow(UnauthorizedError);
    }
    expect((await service.verifyCode(EMAIL, secondCode)).user).toEqual(user);
  });

  test("gives the same error for every kind of failure", async () => {
    const { service, codeFromEmail } = setUp();
    await service.requestCode(EMAIL, "en");

    const unknownEmail = await service.verifyCode("nobody@example.com", "123456").catch((error) => error);
    const wrongCode = await service.verifyCode(EMAIL, otherCode(codeFromEmail())).catch((error) => error);

    expect(unknownEmail.message).toBe(wrongCode.message);
    expect(unknownEmail.code).toBe("invalid-code");
    expect(wrongCode.code).toBe("invalid-code");
  });
});

describe("listTestAccounts", () => {
  test("lists the accounts", async () => {
    const { service } = setUp();

    expect(await service.listTestAccounts()).toEqual([{ email: EMAIL, name: "L. Hoffmann", role: "consultant" }]);
  });

  test("is not available when switched off", async () => {
    const { service } = setUp({ testAccountsEnabled: false });

    await expect(service.listTestAccounts()).rejects.toThrow(NotFoundError);
  });
});

describe("verifySessionToken", () => {
  test("rejects a token whose content was changed", async () => {
    const { service, codeFromEmail } = setUp();
    await service.requestCode(EMAIL, "en");
    const { token } = await service.verifyCode(EMAIL, codeFromEmail());
    const [header, , signature] = token.split(".");
    const forgedClaims = Buffer.from(JSON.stringify({ sub: "user-purchasing", role: "purchasing" })).toString("base64url");

    expect(() => service.verifySessionToken(`${header}.${forgedClaims}.${signature}`)).toThrow(UnauthorizedError);
  });

  test("rejects a token signed with another secret", () => {
    const { service } = setUp();
    const token = jwt.sign({ role: "purchasing" }, "another-secret", { subject: "user-purchasing" });

    expect(() => service.verifySessionToken(token)).toThrow(UnauthorizedError);
  });

  test("rejects an expired token", () => {
    const { service } = setUp();
    const token = jwt.sign({ role: "consultant" }, SECRET, { subject: "user-consultant", expiresIn: -1 });

    expect(() => service.verifySessionToken(token)).toThrow(UnauthorizedError);
  });

  test("rejects an unsigned token", () => {
    const { service } = setUp();
    const token = jwt.sign({ role: "consultant" }, "", { subject: "user-consultant", algorithm: "none" });

    expect(() => service.verifySessionToken(token)).toThrow(UnauthorizedError);
  });
});

describe("profile", () => {
  test("signing in leaves an entry in the user's activity", async () => {
    const { service, activities } = setUp({ showCodes: true });
    const { testCode } = await service.requestCode(EMAIL, "en");

    await service.verifyCode(EMAIL, testCode as string);

    expect(await activities.listOwn(user.id)).toMatchObject([{ type: "signed_in", actorName: "L. Hoffmann" }]);
  });

  test("a new name is stored, returned and logged", async () => {
    const { service, activities } = setUp();

    expect(await service.updateProfile(user.id, "Lena Hoffmann")).toMatchObject({ name: "Lena Hoffmann", email: EMAIL, role: "consultant" });
    expect(await service.getProfile(user.id)).toMatchObject({ name: "Lena Hoffmann" });
    expect((await activities.listOwn(user.id)).map((entry) => entry.type)).toEqual(["profile_updated"]);
  });

  test("the same name changes nothing and logs nothing", async () => {
    const { service, activities } = setUp();

    await service.updateProfile(user.id, user.name);

    expect(await activities.listOwn(user.id)).toEqual([]);
  });

  test("a session for a user who no longer exists has no profile", async () => {
    const { service } = setUp();

    await expect(service.getProfile("deleted-user")).rejects.toThrow(UnauthorizedError);
  });
});
