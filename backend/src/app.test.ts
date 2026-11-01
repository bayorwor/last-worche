// Sends real HTTP requests through the routes, guards and error handler, with storage in memory.
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { createApp } from "./app.ts";
import type { Role } from "./domain/user.ts";
import { createInMemoryActivityRepository } from "./repositories/inMemoryActivityRepository.ts";
import { createInMemoryBookingRepository } from "./repositories/inMemoryBookingRepository.ts";
import { createInMemoryUserRepository } from "./repositories/inMemoryUserRepository.ts";

const ORDER_ID = "4500012345";
const OTHER_ORDER_ID = "4500012346";

const users = [
  { id: "user-consultant", name: "L. Hoffmann", email: "l.hoffmann@test.example", role: "consultant", consultantId: "consultant-1" },
  { id: "user-other-consultant", name: "S. Tanriver", email: "s.tanriver@test.example", role: "consultant", consultantId: "consultant-3" },
  { id: "user-project-lead", name: "A. Weber", email: "a.weber@test.example", role: "project_lead", consultantId: null },
  { id: "user-other-lead", name: "B. Lang", email: "b.lang@test.example", role: "project_lead", consultantId: null },
  { id: "user-purchasing", name: "K. Vogel", email: "k.vogel@test.example", role: "purchasing", consultantId: null },
].map((user) => ({ ...user, role: user.role as Role["id"] }));

const roles: Role[] = [
  { id: "consultant", names: { de: "Berater", en: "Consultant" }, summaries: { de: "buchen", en: "book time" } },
];

const newBooking = { orderId: ORDER_ID, date: "2026-10-27", startTime: "09:00", endTime: "17:00", hours: 7, description: "Work" };

let server: Server;
let baseUrl: string;

beforeAll(() => {
  const orders = [
    { id: ORDER_ID, orderedPersonDays: 140, projectLeadId: "user-project-lead" },
    { id: OTHER_ORDER_ID, orderedPersonDays: 20, projectLeadId: "user-other-lead" },
  ];
  const activityRepository = createInMemoryActivityRepository(users, orders);
  const app = createApp({
    bookingRepository: createInMemoryBookingRepository(
      orders,
      [
        { consultantId: "consultant-1", orderId: ORDER_ID },
        { consultantId: "consultant-3", orderId: OTHER_ORDER_ID },
      ],
      activityRepository,
    ),
    userRepository: createInMemoryUserRepository(users, roles),
    activityRepository,
    signInLimitPerMinute: 100_000, // these tests sign in far more often than a person would
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

// The tests run with MAIL_MOCK on, so the code comes back in the response.
async function requestCode(email: string): Promise<string> {
  const response = await send("POST", "/auth/request-code", { body: { email, language: "en" } });
  return ((await response.json()) as { testCode: string }).testCode;
}

async function signIn(userId: string): Promise<string> {
  const email = users.find((user) => user.id === userId)?.email as string;
  const response = await send("POST", "/auth/verify-code", { body: { email, code: await requestCode(email) } });
  return ((await response.json()) as { token: string }).token;
}

describe("sign-in", () => {
  test("anyone can read the roles", async () => {
    expect(await (await send("GET", "/auth/roles")).json()).toEqual(roles);
  });

  test("the test accounts list each user's email, name and role", async () => {
    const accounts = (await (await send("GET", "/auth/test-accounts")).json()) as object[];

    expect(accounts[0]).toEqual({ email: "l.hoffmann@test.example", name: "L. Hoffmann", role: "consultant" });
  });

  test("the email does not depend on upper or lower case", async () => {
    const code = await requestCode(" A.WEBER@test.example ");

    const response = await send("POST", "/auth/verify-code", { body: { email: "a.weber@TEST.example", code } });

    expect(response.status).toBe(200);
  });

  test("an unknown email gets the same status, with no code", async () => {
    const response = await send("POST", "/auth/request-code", { body: { email: "nobody@test.example" } });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({});
  });

  test("rejects a wrong code and an unknown email with the same answer", async () => {
    const code = await requestCode("a.weber@test.example");
    const wrongCode = code === "000000" ? "000001" : "000000";

    const wrong = await send("POST", "/auth/verify-code", { body: { email: "a.weber@test.example", code: wrongCode } });
    const unknown = await send("POST", "/auth/verify-code", { body: { email: "nobody@test.example", code: wrongCode } });

    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(await wrong.json()).toEqual(await unknown.json());
  });

  test("rejects a malformed email or code with 400", async () => {
    expect((await send("POST", "/auth/request-code", { body: { email: "not-an-email" } })).status).toBe(400);
    expect((await send("POST", "/auth/verify-code", { body: { email: "a.weber@test.example", code: "12345" } })).status).toBe(400);
    expect((await send("POST", "/auth/verify-code", { body: { email: "a.weber@test.example", code: "abcdef" } })).status).toBe(400);
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

  test("the booking assistant uses the consultant's own date", async () => {
    const response = await send("POST", "/ai/parse-booking", {
      token: await signIn("user-consultant"),
      body: { sentence: "9 to 5", today: "2026-11-03" },
    });

    expect(((await response.json()) as { date: string }).date).toBe("2026-11-03");
  });

  test("the rule check tells a consultant what would happen, and stores nothing", async () => {
    const token = await signIn("user-consultant");
    const body = { ...newBooking, date: "2026-12-07" };

    const response = await send("POST", "/bookings/check", { token, body });

    expect(response.status).toBe(200);
    expect(((await response.json()) as { checks: { passed: boolean }[] }).checks.every((check) => check.passed)).toBe(true);
    expect((await send("POST", "/bookings", { token, body })).status).toBe(201);
  });

  test("only a consultant can use the rule check", async () => {
    const response = await send("POST", "/bookings/check", { token: await signIn("user-purchasing"), body: newBooking });

    expect(response.status).toBe(403);
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
    ["GET", "/purchasing/supplier-overview"],
    ["GET", "/purchasing/framework-agreements"],
    ["GET", "/purchasing/invoices"],
    ["POST", "/purchasing/invoices"],
    ["POST", "/purchasing/follow-up-requests/1/decline"],
    ["GET", `/orders/${ORDER_ID}/proofs-of-work`],
    ["POST", `/orders/${ORDER_ID}/proofs-of-work/2026-10/approve`],
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

  test("purchasing reads totals per supplier, with no person in them", async () => {
    const consultantToken = await signIn("user-consultant");
    await send("POST", "/bookings", { token: consultantToken, body: { ...newBooking, date: "2026-08-03" } });

    const response = await send("GET", "/purchasing/supplier-overview", { token: await signIn("user-purchasing") });
    const body = JSON.stringify(await response.json());

    expect(response.status).toBe(200);
    expect(body).toContain("usedPersonDays");
    expect(body).not.toContain("Hoffmann");
    expect(body).not.toContain("consultant");
    expect(body).not.toContain("2026-08-03");
  });

  test("only purchasing may read the supplier overview", async () => {
    for (const user of ["user-consultant", "user-project-lead"]) {
      const response = await send("GET", "/purchasing/supplier-overview", { token: await signIn(user) });

      expect(response.status).toBe(403);
    }
  });

  test("only a project lead may read or approve a proof of work", async () => {
    for (const user of ["user-consultant", "user-purchasing"]) {
      const token = await signIn(user);

      expect((await send("GET", `/orders/${ORDER_ID}/proofs-of-work`, { token })).status).toBe(403);
      expect((await send("POST", `/orders/${ORDER_ID}/proofs-of-work/2026-10/approve`, { token })).status).toBe(403);
    }
  });

  test("a project lead cannot approve an order they do not lead", async () => {
    const response = await send("POST", `/orders/${OTHER_ORDER_ID}/proofs-of-work/2026-10/approve`, {
      token: await signIn("user-project-lead"),
    });

    expect(response.status).toBe(403);
  });

  test("a malformed month is rejected with 400", async () => {
    const response = await send("POST", `/orders/${ORDER_ID}/proofs-of-work/october/approve`, {
      token: await signIn("user-project-lead"),
    });

    expect(response.status).toBe(400);
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
    for (const origin of ["capacitor://localhost", "http://localhost"]) {
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

describe("profile", () => {
  test("changes the signed-in user's own name, and /auth/me shows it with the same session", async () => {
    const token = await signIn("user-other-consultant");

    const response = await send("PATCH", "/auth/me", { token, body: { name: "  Selin Tanriver " } });

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ id: "user-other-consultant", name: "Selin Tanriver" });
    expect(await (await send("GET", "/auth/me", { token })).json()).toMatchObject({ name: "Selin Tanriver" });
  });

  test("cannot change the role, email or another user, whatever the body says", async () => {
    const token = await signIn("user-purchasing");

    const response = await send("PATCH", "/auth/me", {
      token,
      body: { id: "user-project-lead", name: "K. Vogel", role: "project_lead", email: "other@test.example", consultantId: "consultant-1" },
    });

    expect(await response.json()).toMatchObject({
      id: "user-purchasing",
      role: "purchasing",
      email: "k.vogel@test.example",
      consultantId: null,
    });
  });

  test("rejects an empty or too long name with 400", async () => {
    const token = await signIn("user-purchasing");

    expect((await send("PATCH", "/auth/me", { token, body: { name: "   " } })).status).toBe(400);
    expect((await send("PATCH", "/auth/me", { token, body: { name: "x".repeat(101) } })).status).toBe(400);
  });

  test("requires a session", async () => {
    expect((await send("PATCH", "/auth/me", { body: { name: "Nobody" } })).status).toBe(401);
  });
});

// Runs last, because approving a month changes what later bookings in that month may do.
describe("recent activity", () => {
  type Entry = { type: string; isOwn: boolean; actorName: string | null; orderId: string | null; period: string | null };

  async function activityOf(userId: string) {
    return (await (await send("GET", "/activity", { token: await signIn(userId) })).json()) as Entry[];
  }

  beforeAll(async () => {
    const booking = { ...newBooking, date: "2026-12-01" };
    await send("POST", "/bookings", { token: await signIn("user-consultant"), body: booking });
    await send("POST", "/orders/4500012345/proofs-of-work/2026-12/approve", { token: await signIn("user-project-lead") });
  });

  test("requires a session", async () => {
    expect((await send("GET", "/activity")).status).toBe(401);
  });

  test("a consultant sees only what they did themselves", async () => {
    const entries = await activityOf("user-consultant");

    expect(entries.some((entry) => entry.type === "booking_created" && entry.period === "2026-12-01")).toBe(true);
    expect(entries.every((entry) => entry.isOwn)).toBe(true);
  });

  test("a project lead sees who booked on their order", async () => {
    const entries = await activityOf("user-project-lead");

    expect(entries.find((entry) => entry.type === "booking_created")).toMatchObject({ isOwn: false, actorName: "L. Hoffmann", orderId: ORDER_ID });
  });

  test("another project lead sees nothing of that order", async () => {
    const entries = await activityOf("user-other-lead");

    expect(entries.filter((entry) => entry.orderId === ORDER_ID)).toEqual([]);
  });

  test("purchasing sees no single booking and no other person's name", async () => {
    const entries = await activityOf("user-purchasing");

    expect(entries.some((entry) => entry.type === "booking_created")).toBe(false);
    expect(entries.find((entry) => entry.type === "proof_approved")).toMatchObject({ actorName: null, orderId: ORDER_ID, period: "2026-12" });
    expect(entries.filter((entry) => !entry.isOwn).every((entry) => entry.actorName === null)).toBe(true);
  });
});

describe("forecast and follow-up requests", () => {
  test("a project lead gets a forecast of their own order", async () => {
    const response = await send("GET", `/orders/${ORDER_ID}/forecast`, { token: await signIn("user-project-lead") });

    expect(response.status).toBe(200);
  });

  test("purchasing and consultants may not see a forecast", async () => {
    expect((await send("GET", `/orders/${ORDER_ID}/forecast`, { token: await signIn("user-purchasing") })).status).toBe(403);
    expect((await send("GET", `/orders/${ORDER_ID}/forecast`, { token: await signIn("user-consultant") })).status).toBe(403);
  });

  test("rejects an invalid scenario with 400", async () => {
    const token = await signIn("user-project-lead");

    expect((await send("GET", `/orders/${ORDER_ID}/forecast?extraConsultants=0`, { token })).status).toBe(400);
    expect((await send("GET", `/orders/${ORDER_ID}/forecast?projectEndShiftWeeks=-4`, { token })).status).toBe(400);
  });

  test("purchasing confirms a lead's request, and only purchasing may", async () => {
    const leadToken = await signIn("user-other-lead");
    const buyerToken = await signIn("user-purchasing");
    const body = { personDays: 5, neededByDate: "2026-12-01" };

    expect((await send("POST", `/orders/${OTHER_ORDER_ID}/follow-up-requests`, { token: buyerToken, body })).status).toBe(403);
    const created = await send("POST", `/orders/${OTHER_ORDER_ID}/follow-up-requests`, { token: leadToken, body });
    expect(created.status).toBe(201);
    const { id } = (await created.json()) as { id: number };

    expect((await send("POST", `/purchasing/follow-up-requests/${id}/confirm`, { token: leadToken })).status).toBe(403);
    expect((await send("POST", `/purchasing/follow-up-requests/${id}/confirm`, { token: buyerToken })).status).toBe(200);
    expect(await (await send("GET", `/orders/${OTHER_ORDER_ID}/budget`, { token: buyerToken })).json()).toMatchObject({ orderedPersonDays: 25 });
  });

  test("purchasing declines a lead's request, and only purchasing may", async () => {
    const leadToken = await signIn("user-other-lead");
    const buyerToken = await signIn("user-purchasing");
    const created = await send("POST", `/orders/${OTHER_ORDER_ID}/follow-up-requests`, { token: leadToken, body: { personDays: 5, neededByDate: "2026-12-01" } });
    const { id } = (await created.json()) as { id: number };

    expect((await send("POST", `/purchasing/follow-up-requests/${id}/decline`, { token: leadToken })).status).toBe(403);
    expect((await send("POST", `/purchasing/follow-up-requests/${id}/decline`, { token: buyerToken })).status).toBe(200);
    expect((await send("POST", `/purchasing/follow-up-requests/${id}/confirm`, { token: buyerToken })).status).toBe(422);
  });

  test("only purchasing may read or store invoices, and invalid input is rejected", async () => {
    const buyerToken = await signIn("user-purchasing");
    const leadToken = await signIn("user-other-lead");

    expect((await send("GET", "/purchasing/invoices", { token: buyerToken })).status).toBe(200);
    expect((await send("GET", "/purchasing/invoices", { token: leadToken })).status).toBe(403);
    expect((await send("POST", "/purchasing/invoices", { token: leadToken, body: {} })).status).toBe(403);
    expect((await send("POST", "/purchasing/invoices", { token: buyerToken, body: { orderId: ORDER_ID, month: "2026-10", invoiceNumber: " ", invoicedPersonDays: 1 } })).status).toBe(400);
  });

  test("framework agreements are for purchasing only", async () => {
    const response = await send("GET", "/purchasing/framework-agreements", { token: await signIn("user-purchasing") });

    expect(response.status).toBe(200);
    expect((await send("GET", "/purchasing/framework-agreements", { token: await signIn("user-other-lead") })).status).toBe(403);
    expect((await send("GET", "/purchasing/framework-agreements", { token: await signIn("user-consultant") })).status).toBe(403);
  });

  test("purchasing's activity shows that request with no name", async () => {
    const entries = (await (await send("GET", "/activity", { token: await signIn("user-purchasing") })).json()) as { type: string; actorName: string | null; isOwn: boolean }[];

    expect(entries.find((entry) => entry.type === "follow_up_requested")).toMatchObject({ actorName: null });
  });
});

describe("time tracking interface", () => {
  const send2 = (key: string | null, bookings: object[]) =>
    fetch(`${baseUrl}/integrations/time-tracking/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(key ? { "x-api-key": key } : {}) },
      body: JSON.stringify({ bookings }),
    });
  const row = { ...newBooking, consultantId: "consultant-1", date: "2026-12-10" };

  test("needs a supplier key", async () => {
    expect((await send2(null, [row])).status).toBe(401);
    expect((await send2("wrong-key", [row])).status).toBe(401);
  });

  test("a session token is not enough", async () => {
    const response = await fetch(`${baseUrl}/integrations/time-tracking/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${await signIn("user-consultant")}` },
      body: JSON.stringify({ bookings: [row] }),
    });

    expect(response.status).toBe(401);
  });

  test("rejects a badly formed batch with 400", async () => {
    expect((await send2("demo-consultis-key", [])).status).toBe(400);
    expect((await send2("demo-consultis-key", [{ ...row, startTime: "late" }])).status).toBe(400);
  });
});

describe("invoice check", () => {
  test("only purchasing may use it, and a month with no approved proof is rejected", async () => {
    const body = { orderId: ORDER_ID, month: "2030-01", invoicedPersonDays: 10 };

    expect((await send("POST", "/purchasing/invoice-check", { token: await signIn("user-project-lead"), body })).status).toBe(403);
    const response = await send("POST", "/purchasing/invoice-check", { token: await signIn("user-purchasing"), body });
    expect(response.status).toBe(422);
    expect(await response.json()).toMatchObject({ rule: "invoice-no-approved-proof" });
  });

  test("compares the invoice with an approved month", async () => {
    const consultant = await signIn("user-consultant");
    await send("POST", "/bookings", { token: consultant, body: { ...newBooking, date: "2027-02-01", hours: 8 } });
    await send("POST", `/orders/${ORDER_ID}/proofs-of-work/2027-02/approve`, { token: await signIn("user-project-lead") });

    const response = await send("POST", "/purchasing/invoice-check", {
      token: await signIn("user-purchasing"),
      body: { orderId: ORDER_ID, month: "2027-02", invoicedPersonDays: 3.5 },
    });

    expect(await response.json()).toEqual({ status: "over-approved", approvedPersonDays: 1, invoicedPersonDays: 3.5, differencePersonDays: 2.5 });
  });

  test("a project lead can download that approved month, and purchasing cannot", async () => {
    const path = `/orders/${ORDER_ID}/proofs-of-work/2027-02/export.csv`;
    const response = await send("GET", path, { token: await signIn("user-project-lead") });

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/csv");
    expect(await response.text()).toContain("2027-02-01");
    expect((await send("GET", path, { token: await signIn("user-purchasing") })).status).toBe(403);
  });
});

describe("operation", () => {
  test("the health check says the API and its database work", async () => {
    const response = await send("GET", "/health");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok", database: "ok" });
  });

  test("the API documentation is served", async () => {
    expect(((await (await send("GET", "/openapi.json")).json()) as { openapi: string }).openapi).toStartWith("3.");
    expect((await fetch(`${baseUrl}/docs/`)).status).toBe(200);
  });

  test("an unknown API address answers 404 in JSON", async () => {
    const response = await send("GET", "/no-such-address");

    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({ error: expect.any(String) });
  });

  test("responses carry security headers", async () => {
    expect((await send("GET", "/health")).headers.get("x-content-type-options")).toBe("nosniff");
  });

  test("a body that is too large is rejected, not a server error", async () => {
    const response = await send("POST", "/auth/request-code", { body: { email: "x".repeat(2_000_000) } });

    expect(response.status).toBe(413);
  });

  test("too many sign-in attempts are rejected", async () => {
    const limitedApp = createApp({
      bookingRepository: createInMemoryBookingRepository([], []),
      userRepository: createInMemoryUserRepository([]),
      activityRepository: createInMemoryActivityRepository(),
      signInLimitPerMinute: 2,
    });
    const limitedServer = limitedApp.listen(0);
    const url = `http://localhost:${(limitedServer.address() as AddressInfo).port}/api/auth/request-code`;
    const attempt = () =>
      fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: "a@test.example" }) });

    try {
      expect((await attempt()).status).toBe(200);
      expect((await attempt()).status).toBe(200);
      expect((await attempt()).status).toBe(429);
    } finally {
      limitedServer.close();
    }
  });
});
