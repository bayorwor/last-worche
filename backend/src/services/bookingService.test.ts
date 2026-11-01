import { describe, expect, test } from "bun:test";
import { BusinessRuleError, NotFoundError } from "../domain/errors.ts";
import { createInMemoryBookingRepository } from "../repositories/inMemoryBookingRepository.ts";
import { createBookingService } from "./bookingService.ts";

const ORDER_ID = "4500012345";
const OTHER_ORDER_ID = "4500012346";
const SECOND_ASSIGNED_ORDER_ID = "4500012347";

function createService() {
  return createBookingService(
    createInMemoryBookingRepository(
      [
        { id: ORDER_ID, orderedPersonDays: 140 },
        { id: OTHER_ORDER_ID, orderedPersonDays: 10 },
        { id: SECOND_ASSIGNED_ORDER_ID, orderedPersonDays: 10 },
      ],
      [
        { consultantId: "consultant-1", orderId: ORDER_ID },
        { consultantId: "consultant-1", orderId: SECOND_ASSIGNED_ORDER_ID },
        { consultantId: "consultant-2", orderId: ORDER_ID },
      ],
    ),
  );
}

const booking = {
  orderId: ORDER_ID,
  consultantId: "consultant-1",
  date: "2026-10-27",
  startTime: "09:00",
  endTime: "17:00",
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

  test("rejects a booking on an order the consultant is not assigned to, and stores nothing", async () => {
    const service = createService();

    await expect(service.createBooking({ ...booking, orderId: OTHER_ORDER_ID })).rejects.toThrow(BusinessRuleError);
    expect((await service.getOrderBudget(OTHER_ORDER_ID)).usedPersonDays).toBe(0);
  });

  test("lists only the orders a consultant is assigned to", async () => {
    const assignedOrders = await createService().listAssignedOrders("consultant-1");

    expect(assignedOrders.map((order) => order.id)).toEqual([ORDER_ID, SECOND_ASSIGNED_ORDER_ID]);
  });

  test("rejects an overlap with the same person's booking on another order, and stores nothing", async () => {
    const service = createService();
    await service.createBooking({ ...booking, startTime: "09:00", endTime: "12:00", hours: 3 });

    const overlapping = { ...booking, orderId: SECOND_ASSIGNED_ORDER_ID, startTime: "11:00", endTime: "13:00", hours: 2 };

    await expect(service.createBooking(overlapping)).rejects.toThrow(BusinessRuleError);
    expect((await service.getOrderBudget(SECOND_ASSIGNED_ORDER_ID)).usedPersonDays).toBe(0);
  });

  test("accepts a booking that starts when the last one ended", async () => {
    const service = createService();
    await service.createBooking({ ...booking, startTime: "09:00", endTime: "12:00", hours: 3 });

    await service.createBooking({ ...booking, startTime: "12:00", endTime: "15:00", hours: 3 });

    expect((await service.getOrderBudget(ORDER_ID)).usedPersonDays).toBe(0.75);
  });

  test("accepts the same hours on another day, or for another person", async () => {
    const service = createService();
    await service.createBooking(booking);

    await service.createBooking({ ...booking, date: "2026-10-28" });
    await service.createBooking({ ...booking, consultantId: "consultant-2" });

    expect((await service.getOrderBudget(ORDER_ID)).usedPersonDays).toBe(2.625);
  });

  test("counts the 10-hour day across all of a person's orders, and stores nothing when rejected", async () => {
    const service = createService();
    await service.createBooking({ ...booking, startTime: "08:00", endTime: "16:30", hours: 8.5 });

    const tooLong = { ...booking, orderId: SECOND_ASSIGNED_ORDER_ID, startTime: "17:00", endTime: "19:00", hours: 2 };

    await expect(service.createBooking(tooLong)).rejects.toThrow(BusinessRuleError);
    expect((await service.getOrderBudget(SECOND_ASSIGNED_ORDER_ID)).usedPersonDays).toBe(0);

    await service.createBooking({ ...tooLong, endTime: "18:30", hours: 1.5 });
    expect((await service.getOrderBudget(SECOND_ASSIGNED_ORDER_ID)).usedPersonDays).toBe(0.1875);
  });

  test("checks the 11-hour rest across a person's orders, in both directions", async () => {
    const service = createService();
    await service.createBooking({ ...booking, date: "2026-10-26", startTime: "12:00", endTime: "22:00", hours: 10 });

    const tooEarly = { ...booking, orderId: SECOND_ASSIGNED_ORDER_ID, startTime: "08:00", endTime: "12:00", hours: 4 };
    await expect(service.createBooking(tooEarly)).rejects.toThrow(BusinessRuleError);
    expect((await service.getOrderBudget(SECOND_ASSIGNED_ORDER_ID)).usedPersonDays).toBe(0);

    await service.createBooking({ ...tooEarly, startTime: "09:00" });

    const earlyNextDay = { ...booking, date: "2026-10-28", startTime: "06:00", endTime: "08:00", hours: 2 };
    await service.createBooking(earlyNextDay);
    const addedAfterwards = { ...booking, date: "2026-10-27", startTime: "20:00", endTime: "22:00", hours: 2 };
    await expect(service.createBooking(addedAfterwards)).rejects.toThrow(BusinessRuleError);
  });

  test("rejects a booking on an unknown order", async () => {
    const service = createService();

    await expect(service.createBooking({ ...booking, orderId: "missing" })).rejects.toThrow(NotFoundError);
  });
});

describe("createBooking with an order period and a consultant's calendar", () => {
  const service = createBookingService(
    createInMemoryBookingRepository(
      [{ id: ORDER_ID, orderedPersonDays: 140, startDate: "2026-07-01", endDate: "2026-12-31" }],
      [{ consultantId: "consultant-1", orderId: ORDER_ID }, { consultantId: "consultant-2", orderId: ORDER_ID }],
      undefined,
      {
        "consultant-1": { federalState: "BY", vacations: [{ startDate: "2026-12-21", endDate: "2026-12-24" }] },
        "consultant-2": { federalState: "HH", vacations: [] },
      },
    ),
  );

  test("stores nothing for a day outside the order period", async () => {
    await expect(service.createBooking({ ...booking, date: "2027-01-15" })).rejects.toThrow("outside the order period");
  });

  test("rejects a day of approved vacation", async () => {
    await expect(service.createBooking({ ...booking, date: "2026-12-23" })).rejects.toThrow("approved vacation");
  });

  test("rejects a holiday of the consultant's own state", async () => {
    await expect(service.createBooking({ ...booking, date: "2026-11-01" })).rejects.toThrow("All Saints' Day");
  });

  test("accepts that holiday for a consultant from another state", async () => {
    await expect(service.createBooking({ ...booking, consultantId: "consultant-2", date: "2026-11-01" })).resolves.toMatchObject({ date: "2026-11-01" });
  });
});
