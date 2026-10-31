// Sends real HTTP requests through the routes, guards and error handler, with storage in memory.
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { createApp } from "./app.ts";
import type { Role } from "./domain/user.ts";
import { createInMemoryBookingRepository } from "./repositories/inMemoryBookingRepository.ts";
import { createInMemoryUserRepository } from "./repositories/inMemoryUserRepository.ts";

const ORDER_ID = "4500012345";
const OTHER_ORDER_ID = "4500012346";

const PASSWORD = "correct-password";
const passwordHash = Bun.password.hashSync(PASSWORD, { algorithm: "bcrypt", cost: 4 }); // low cost, so the tests stay fast

const accounts = [
  { id: "user-consultant", name: "L. Hoffmann", email: "l.hoffmann@test.example", role: "consultant", consultantId: "consultant-1" },
  { id: "user-other-consultant", name: "S. Tanriver", email: "s.tanriver@test.example", role: "consultant", consultantId: "consultant-3" },
  { id: "user-project-lead", name: "A. Weber", email: "a.weber@test.example", role: "project_lead", consultantId: null },
  { id: "user-other-lead", name: "B. Lang", email: "b.lang@test.example", role: "project_lead", consultantId: null },
  { id: "user-purchasing", name: "K. Vogel", email: "k.vogel@test.example", role: "purchasing", consultantId: null },
].map((account) => ({ ...account, role: account.role as Role["id"], passwordHash }));

const roles: Role[] = [
  { id: "consultant", names: { de: "Berater", en: "Consultant" }, summaries: { de: "buchen", en: "book time" } },
];

const newBooking = { orderId: ORDER_ID, date: "2026-10-27", startTime: "09:00", endTime: "17:00", hours: 7, description: "Work" };

let server: Server;
let baseUrl: string;

beforeAll(() => {
  const app = createApp({
    bookingRepository: createInMemoryBookingRepository(
      [
        { id: ORDER_ID, orderedPersonDays: 140, projectLeadId: "user-project-lead" },
        { id: OTHER_ORDER_ID, orderedPersonDays: 20, projectLeadId: "user-other-lead" },
      ],
      [
        { consultantId: "consultant-1", orderId: ORDER_ID },
        { consultantId: "consultant-3", orderId: OTHER_ORDER_ID },
      ],
    ),
    userRepository: createInMemoryUserRepository(accounts, roles),
  });
  server = app.listen(0);
  baseUrl = `http://localhost:${(server.address() as AddressInfo).port}/api`;
});

afterAll(() => {
  server.close();
});

function send(method: string, path: string, { token, body }: { token?: string; body?: unknown } = {}) {
  return fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

async function signIn(userId: string): Promise<string> {
  const email = accounts.find((account) => account.id === userId)?.email;
  const response = await send("POST", "/auth/sign-in", { body: { email, password: PASSWORD } });
  return ((await response.json()) as { token: string }).token;
}

describe("sign-in", () => {
  test("anyone can read the roles", async () => {
    expect(await (await send("GET", "/auth/roles")).json()).toEqual(roles);
  });

  test("the test accounts never include a password hash", async () => {
    const response = await send("GET", "/auth/test-accounts");
    const body = (await response.json()) as { accounts: { role: string }[] };

    expect(body.accounts.map(({ role }) => role)).toContain("purchasing");
    expect(JSON.stringify(body)).not.toContain(passwordHash);
  });

  test("the email does not depend on upper or lower case", async () => {
    const response = await send("POST", "/auth/sign-in", { body: { email: " A.WEBER@test.example ", password: PASSWORD } });

    expect(response.status).toBe(200);
    expect(JSON.stringify(await response.json())).not.toContain(passwordHash);
  });

  test("rejects a wrong password and an unknown email with the same answer", async () => {
    const wrongPassword = await send("POST", "/auth/sign-in", { body: { email: "a.weber@test.example", password: "wrong" } });
    const unknownEmail = await send("POST", "/auth/sign-in", { body: { email: "nobody@test.example", password: PASSWORD } });

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(await wrongPassword.json()).toEqual(await unknownEmail.json());
  });

  test("rejects a malformed email with 400", async () => {
    expect((await send("POST", "/auth/sign-in", { body: { email: "not-an-email", password: PASSWORD } })).status).toBe(400);
  });

  test("a session tells the server who is signed in", async () => {
    const response = await send("GET", "/auth/me", { token: await signIn("user-project-lead") });

    expect(await response.json()).toMatchObject({ name: "A. Weber", role: "project_lead" });
  });

  test("rejects a made-up token with 401", async () => {
    expect((await send("GET", "/auth/me", { token: "not-a-token" })).status).toBe(401);
  });
});

describe("consultant identity", () => {
  test("comes from the session, so a forged consultant ID in the body is ignored", async () => {
    const response = await send("POST", "/bookings", {
      token: await signIn("user-consultant"),
      body: { ...newBooking, consultantId: "consultant-2" },
    });

    expect(response.status).toBe(201);
    expect(((await response.json()) as { consultantId: string }).consultantId).toBe("consultant-1");
  });

  test("booking without a session is rejected with 401", async () => {
    expect((await send("POST", "/bookings", { body: { ...newBooking, date: "2026-10-28" } })).status).toBe(401);
  });

  test("only a consultant can book", async () => {
    const response = await send("POST", "/bookings", {
      token: await signIn("user-project-lead"),
      body: { ...newBooking, date: "2026-10-29" },
    });

    expect(response.status).toBe(403);
  });
});

describe("every route except sign-in needs a session", () => {
  test.each([
    ["GET", "/auth/me"],
    ["GET", "/orders"],
    ["GET", `/orders/${ORDER_ID}/budget`],
    ["GET", `/orders/${ORDER_ID}/bookings`],
    ["GET", "/consultants/consultant-1/bookings"],
    ["POST", "/bookings"],
    ["POST", "/ai/parse-booking"],
  ])("%s %s is rejected with 401, before any handler or validation", async (method, path) => {
    const response = await send(method, path, method === "POST" ? { body: {} } : {});

    expect(response.status).toBe(401);
  });
});

describe("role checks", () => {
  test("purchasing is rejected when asking for single bookings of an order", async () => {
    const response = await send("GET", `/orders/${ORDER_ID}/bookings`, { token: await signIn("user-purchasing") });

    expect(response.status).toBe(403);
  });

  test("purchasing is rejected when asking for a consultant's bookings", async () => {
    const response = await send("GET", "/consultants/consultant-1/bookings", { token: await signIn("user-purchasing") });

    expect(response.status).toBe(403);
  });

  test("purchasing cannot book or use the booking assistant", async () => {
    const token = await signIn("user-purchasing");

    expect((await send("POST", "/bookings", { token, body: newBooking })).status).toBe(403);
    expect((await send("POST", "/ai/parse-booking", { token, body: { sentence: "x" } })).status).toBe(403);
  });

  test("purchasing sees aggregated budgets of all orders, with nothing about a person", async () => {
    const token = await signIn("user-purchasing");

    const budget = await (await send("GET", `/orders/${OTHER_ORDER_ID}/budget`, { token })).json();

    expect(Object.keys(budget as object).sort()).toEqual(["freePersonDays", "orderId", "orderedPersonDays", "usedPersonDays"]);
    expect(((await (await send("GET", "/orders", { token })).json()) as unknown[]).length).toBe(2);
  });

  test("a consultant cannot use the project lead's route", async () => {
    const response = await send("GET", `/orders/${ORDER_ID}/bookings`, { token: await signIn("user-consultant") });

    expect(response.status).toBe(403);
  });
});

describe("row-level scope", () => {
  test("a consultant is rejected when asking for another consultant's bookings", async () => {
    const response = await send("GET", "/consultants/consultant-3/bookings", { token: await signIn("user-consultant") });

    expect(response.status).toBe(403);
  });

  test("a consultant reads their own bookings", async () => {
    const token = await signIn("user-consultant");
    await send("POST", "/bookings", { token, body: { ...newBooking, date: "2026-09-01" } });

    const response = await send("GET", "/consultants/consultant-1/bookings", { token });

    expect(response.status).toBe(200);
    const bookings = (await response.json()) as { consultantId: string }[];
    expect(bookings.length).toBeGreaterThan(0);
    expect(bookings.every((booking) => booking.consultantId === "consultant-1")).toBe(true);
  });

  test("a consultant only lists and opens assigned orders", async () => {
    const token = await signIn("user-consultant");

    expect(await (await send("GET", "/orders", { token })).json()).toEqual([{ id: ORDER_ID, title: `Order ${ORDER_ID}` }]);
    expect((await send("GET", `/orders/${ORDER_ID}/budget`, { token })).status).toBe(200);
    expect((await send("GET", `/orders/${OTHER_ORDER_ID}/budget`, { token })).status).toBe(403);
  });

  test("a project lead only lists and opens the orders they lead", async () => {
    const token = await signIn("user-project-lead");

    expect(await (await send("GET", "/orders", { token })).json()).toEqual([{ id: ORDER_ID, title: `Order ${ORDER_ID}` }]);
    expect((await send("GET", `/orders/${ORDER_ID}/budget`, { token })).status).toBe(200);
    expect((await send("GET", `/orders/${ORDER_ID}/bookings`, { token })).status).toBe(200);
    expect((await send("GET", `/orders/${OTHER_ORDER_ID}/budget`, { token })).status).toBe(403);
    expect((await send("GET", `/orders/${OTHER_ORDER_ID}/bookings`, { token })).status).toBe(403);
  });

  test("an unknown order is 404, also for purchasing", async () => {
    const response = await send("GET", "/orders/missing/budget", { token: await signIn("user-purchasing") });

    expect(response.status).toBe(404);
  });
});

describe("calls from the mobile app", () => {
  const preflight = (origin: string) =>
    fetch(`${baseUrl}/orders`, {
      method: "OPTIONS",
      headers: { Origin: origin, "Access-Control-Request-Method": "GET", "Access-Control-Request-Headers": "authorization" },
    });

  test("the iOS and Android apps may call the API with a session token", async () => {
    for (const origin of ["capacitor://localhost", "https://localhost"]) {
      const response = await preflight(origin);

      expect(response.headers.get("access-control-allow-origin")).toBe(origin);
      expect(response.headers.get("access-control-allow-headers")?.toLowerCase()).toContain("authorization");
    }
  });

  test("another website may not", async () => {
    const response = await preflight("https://example.com");

    expect(response.headers.get("access-control-allow-origin")).toBeNull();
  });
});
