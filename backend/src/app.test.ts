// Sends real HTTP requests through the routes, guards and error handler, with storage in memory.
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { createApp } from "./app.ts";
import type { User } from "./domain/user.ts";
import { createInMemoryBookingRepository } from "./repositories/inMemoryBookingRepository.ts";
import { createInMemoryUserRepository } from "./repositories/inMemoryUserRepository.ts";

const ORDER_ID = "4500012345";

const users: User[] = [
  { id: "user-consultant", name: "L. Hoffmann", role: "consultant", consultantId: "consultant-1" },
  { id: "user-project-lead", name: "A. Weber", role: "project_lead", consultantId: null },
  { id: "user-purchasing", name: "K. Vogel", role: "purchasing", consultantId: null },
];

const newBooking = { orderId: ORDER_ID, date: "2026-10-27", startTime: "09:00", endTime: "17:00", hours: 7, description: "Work" };

let server: Server;
let baseUrl: string;

beforeAll(() => {
  const app = createApp({
    bookingRepository: createInMemoryBookingRepository(
      [{ id: ORDER_ID, orderedPersonDays: 140 }],
      [{ consultantId: "consultant-1", orderId: ORDER_ID }],
    ),
    userRepository: createInMemoryUserRepository(users),
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
  const response = await send("POST", "/auth/sign-in", { body: { userId } });
  return ((await response.json()) as { token: string }).token;
}

describe("sign-in", () => {
  test("lists one demo user per role to anyone", async () => {
    const response = await send("GET", "/auth/demo-users");

    expect(response.status).toBe(200);
    expect(((await response.json()) as User[]).map((user) => user.role)).toEqual(["consultant", "project_lead", "purchasing"]);
  });

  test("a session tells the server who is signed in", async () => {
    const response = await send("GET", "/auth/me", { token: await signIn("user-project-lead") });

    expect(await response.json()).toMatchObject({ name: "A. Weber", role: "project_lead" });
  });

  test("rejects an unknown demo user with 401", async () => {
    expect((await send("POST", "/auth/sign-in", { body: { userId: "nobody" } })).status).toBe(401);
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
