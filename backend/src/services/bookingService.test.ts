import { describe, expect, test } from "bun:test";
import { BusinessRuleError, NotFoundError } from "../domain/errors.ts";
import { createInMemoryBookingRepository } from "../repositories/inMemoryBookingRepository.ts";
import { createBookingService } from "./bookingService.ts";

const ORDER_ID = "4500012345";

function createService() {
  return createBookingService(createInMemoryBookingRepository([{ id: ORDER_ID, orderedPersonDays: 140 }]));
}

const booking = {
  orderId: ORDER_ID,
  consultantId: "consultant-1",
  date: "2026-10-27",
  hours: 7,
  description: "Legacy data reconciliation",
};

describe("bookingService", () => {
  test("an accepted booking moves the order's budget", async () => {
    const service = createService();
    await service.createBooking(booking);

    const budget = await service.getOrderBudget(ORDER_ID);
    expect(budget.usedPersonDays).toBe(0.875);
    expect(budget.freePersonDays).toBe(139.125);
  });

  test("a rejected booking is never stored", async () => {
    const service = createService();

    await expect(service.createBooking({ ...booking, hours: 2000 })).rejects.toThrow(BusinessRuleError);
    expect((await service.getOrderBudget(ORDER_ID)).usedPersonDays).toBe(0);
  });

  test("rejects a booking on an unknown order", async () => {
    const service = createService();

    await expect(service.createBooking({ ...booking, orderId: "missing" })).rejects.toThrow(NotFoundError);
  });
});
