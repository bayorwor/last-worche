import { beforeEach, describe, expect, test } from "bun:test";
import { ForbiddenError, NotFoundError } from "../domain/errors.ts";
import type { User } from "../domain/user.ts";
import { createInMemoryBookingRepository } from "../repositories/inMemoryBookingRepository.ts";
import { createBookingService } from "./bookingService.ts";
import { createForecastService, type ForecastService } from "./forecastService.ts";

const ORDER_ID = "4500012345";
const lead: User = { id: "lead-1", name: "A. Weber", email: "a@test.example", role: "project_lead", consultantId: null };
const NOW = Date.parse("2026-11-03T12:00:00Z");

let forecasts: ForecastService;
let book: (date: string) => Promise<unknown>;

beforeEach(() => {
  const repository = createInMemoryBookingRepository(
    [{ id: ORDER_ID, orderedPersonDays: 100, projectLeadId: lead.id, projectEndDate: "2027-03-31" }],
    [{ consultantId: "consultant-1", orderId: ORDER_ID }],
  );
  const bookings = createBookingService(repository);
  forecasts = createForecastService(repository, () => NOW);
  book = (date) =>
    bookings.createBooking({ orderId: ORDER_ID, consultantId: "consultant-1", date, startTime: "09:00", endTime: "17:00", hours: 8, description: "Work" });
});

const bookFiveDays = async () => {
  for (const date of ["2026-10-26", "2026-10-27", "2026-10-28", "2026-10-29", "2026-10-30"]) await book(date);
};

describe("getForecastFor", () => {
  test("says there is not enough data instead of making up a date", async () => {
    await book("2026-10-26");

    expect(await forecasts.getForecastFor(lead, ORDER_ID, {})).toMatchObject({ status: "not-enough-data", freePersonDays: 99 });
  });

  test("with enough data, gives the run-out date and its assumptions", async () => {
    await bookFiveDays();

    const result = await forecasts.getForecastFor(lead, ORDER_ID, {});

    expect(result).toMatchObject({ status: "ok", scenario: null, base: { assumptions: { consultantCount: 1, pacePersonDaysPerWeek: 5 } } });
  });

  test("a scenario comes back beside the base, which stays the same", async () => {
    await bookFiveDays();
    const before = await forecasts.getForecastFor(lead, ORDER_ID, {});

    const result = await forecasts.getForecastFor(lead, ORDER_ID, { extraConsultants: 1 });
    const after = await forecasts.getForecastFor(lead, ORDER_ID, {});

    if (result.status !== "ok" || before.status !== "ok" || after.status !== "ok") throw new Error("Expected a forecast");
    expect(result.scenario?.exhaustionDate as string < (result.base.exhaustionDate as string)).toBe(true);
    expect(after.base).toEqual(before.base);
    expect(after.scenario).toBeNull();
  });

  test("only the order's own lead may see it", async () => {
    await expect(forecasts.getForecastFor({ ...lead, id: "lead-2" }, ORDER_ID, {})).rejects.toThrow(ForbiddenError);
    await expect(forecasts.getForecastFor({ ...lead, id: "x", role: "purchasing" }, ORDER_ID, {})).rejects.toThrow(ForbiddenError);
  });

  test("an unknown order is not found", async () => {
    await expect(forecasts.getForecastFor(lead, "missing", {})).rejects.toThrow(NotFoundError);
  });
});
