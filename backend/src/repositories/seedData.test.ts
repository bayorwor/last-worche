import { describe, expect, test } from "bun:test";
import { HOURS_PER_PERSON_DAY } from "../domain/booking.ts";
import {
  ASSIGNMENTS,
  buildDemoBookings,
  CONSULTANTS,
  NEAR_LIMIT_ORDER_ID,
  ORDERS,
  ROLES,
  SEED_ORDER_ID,
  TEST_USERS,
} from "./seedData.ts";

const bookings = buildDemoBookings();

function usedPersonDays(orderId: string) {
  const hours = bookings.filter((booking) => booking.orderId === orderId).reduce((total, booking) => total + booking.hours, 0);
  return hours / HOURS_PER_PERSON_DAY;
}

describe("demo bookings", () => {
  test("use 84 PT of the first order, as in story #9", () => {
    expect(usedPersonDays(SEED_ORDER_ID)).toBe(84);
  });

  test("leave the near-limit order with less than one 7 h booking free", () => {
    const order = ORDERS.find(({ id }) => id === NEAR_LIMIT_ORDER_ID);

    expect(order?.orderedPersonDays).toBe(20);
    expect(usedPersonDays(NEAR_LIMIT_ORDER_ID)).toBe(19.5);
  });

  test("are only on weekdays, and only on orders the consultant is assigned to", () => {
    for (const { date, consultantId, orderId } of bookings) {
      expect([0, 6]).not.toContain(new Date(`${date}T00:00:00Z`).getUTCDay());
      expect(ASSIGNMENTS).toContainEqual({ consultantId, orderId });
    }
  });

  test("never exceed 10 hours per person and day", () => {
    const hoursPerPersonAndDay = new Map<string, number>();
    for (const { consultantId, date, hours } of bookings) {
      const key = `${consultantId} ${date}`;
      hoursPerPersonAndDay.set(key, (hoursPerPersonAndDay.get(key) ?? 0) + hours);
    }

    expect(Math.max(...hoursPerPersonAndDay.values())).toBeLessThanOrEqual(10);
  });
});

describe("test users", () => {
  test("cover every role", () => {
    expect(new Set(TEST_USERS.map((user) => user.role))).toEqual(new Set(ROLES.map((role) => role.id)));
  });

  test("have unique, lowercase, fictional email addresses", () => {
    const emails = TEST_USERS.map((user) => user.email);

    expect(new Set(emails).size).toBe(emails.length);
    expect(emails.every((email) => email === email.toLowerCase() && email.endsWith(".example"))).toBe(true);
  });

  test("include a sign-in for every consultant who has bookings", () => {
    const signedInConsultants = TEST_USERS.map((user) => user.consultantId);

    expect(CONSULTANTS.every((consultant) => signedInConsultants.includes(consultant.id))).toBe(true);
  });
});
