// Runs against a real MySQL database, and only when TEST_DATABASE_URL is set.
// Its bookings are deleted, so never point it at a database whose data you need.
import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import type { Pool } from "mysql2/promise";
import { BusinessRuleError } from "../domain/errors.ts";
import { createBookingService, type BookingService } from "../services/bookingService.ts";
import { openDatabase, SEED_ORDER_ID } from "./database.ts";
import { createMysqlBookingRepository } from "./mysqlBookingRepository.ts";

const databaseUrl = process.env.TEST_DATABASE_URL;

describe.skipIf(!databaseUrl)("mysqlBookingRepository", () => {
  const booking = { orderId: SEED_ORDER_ID, consultantId: "consultant-1", date: "2026-10-27", description: "Work" };
  let db: Pool;
  let service: BookingService;

  beforeAll(async () => {
    db = await openDatabase(databaseUrl as string);
    service = createBookingService(createMysqlBookingRepository(db));
  });

  beforeEach(async () => {
    await db.query("DELETE FROM bookings");
  });

  afterAll(async () => {
    await db.end();
  });

  test("stores a booking and moves the budget", async () => {
    await service.createBooking({ ...booking, hours: 7 });

    expect(await service.getOrderBudget(SEED_ORDER_ID)).toEqual({
      orderId: SEED_ORDER_ID,
      orderedPersonDays: 140,
      usedPersonDays: 0.875,
      freePersonDays: 139.125,
    });
  });

  test("rolls back a rejected booking", async () => {
    await expect(service.createBooking({ ...booking, hours: 2000 })).rejects.toThrow(BusinessRuleError);

    expect((await service.getOrderBudget(SEED_ORDER_ID)).usedPersonDays).toBe(0);
  });

  test("bookings at the same moment cannot exceed the free budget together", async () => {
    const attempts = Array.from({ length: 5 }, () => service.createBooking({ ...booking, hours: 500 }));

    const results = await Promise.allSettled(attempts);

    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(2);
    expect((await service.getOrderBudget(SEED_ORDER_ID)).usedPersonDays).toBe(125);
  });
});
