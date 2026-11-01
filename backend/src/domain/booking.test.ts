import { describe, expect, test } from "bun:test";
import {
  addDays,
  assertAssignedToOrder,
  assertFitsFreeBudget,
  assertNoOverlap,
  assertRestPeriod,
  assertWithinDailyLimit,
  calculateBudget,
  assertInsideOrderPeriod,
  assertNotOnPublicHoliday,
  assertNotOnVacation,
} from "./booking.ts";
import { BusinessRuleError } from "./errors.ts";

const order = { id: "4500012345", orderedPersonDays: 1 };

describe("assertInsideOrderPeriod", () => {
  const period = { startDate: "2026-07-01", endDate: "2026-12-31" };

  test("accepts a booking inside the period", () => {
    expect(() => assertInsideOrderPeriod(period, "2026-10-27")).not.toThrow();
  });

  test("accepts the first and the last day of the period", () => {
    expect(() => assertInsideOrderPeriod(period, "2026-07-01")).not.toThrow();
    expect(() => assertInsideOrderPeriod(period, "2026-12-31")).not.toThrow();
  });

  test("rejects a booking after the period", () => {
    expect(() => assertInsideOrderPeriod(period, "2027-01-15")).toThrow("Booking rejected: outside the order period.");
  });

  test("rejects a booking before the period", () => {
    expect(() => assertInsideOrderPeriod(period, "2026-06-30")).toThrow(BusinessRuleError);
  });
});

describe("assertNotOnVacation", () => {
  const vacations = [{ startDate: "2026-12-24", endDate: "2026-12-30" }];

  test("accepts a day outside any vacation", () => {
    expect(() => assertNotOnVacation(vacations, "2026-12-23")).not.toThrow();
    expect(() => assertNotOnVacation([], "2026-12-24")).not.toThrow();
  });

  test("rejects the first and the last day of a vacation", () => {
    expect(() => assertNotOnVacation(vacations, "2026-12-24")).toThrow("Booking rejected: consultant is on approved vacation.");
    expect(() => assertNotOnVacation(vacations, "2026-12-30")).toThrow(BusinessRuleError);
  });
});

describe("assertNotOnPublicHoliday", () => {
  test("rejects a holiday of the consultant's state, and names it", () => {
    expect(() => assertNotOnPublicHoliday("BY", "2026-11-01")).toThrow("All Saints' Day");
  });

  test("accepts the same day for a consultant from another state", () => {
    expect(() => assertNotOnPublicHoliday("HH", "2026-11-01")).not.toThrow();
  });

  test("accepts an ordinary working day", () => {
    expect(() => assertNotOnPublicHoliday("BY", "2026-11-03")).not.toThrow();
  });
});

describe("free budget rule", () => {
  test("accepts a booking that uses exactly the free budget", () => {
    expect(() => assertFitsFreeBudget(order, 4, 4)).not.toThrow();
  });

  test("rejects a booking beyond the free budget", () => {
    expect(() => assertFitsFreeBudget(order, 4, 4.5)).toThrow(BusinessRuleError);
  });

  test("names the free budget and the order, in the words of story #3", () => {
    const orderWith2_5Free = { id: "4500012345", orderedPersonDays: 2.5 };

    try {
      assertFitsFreeBudget(orderWith2_5Free, 0, 24); // 3 PD
      throw new Error("expected a rejection");
    } catch (error) {
      expect((error as BusinessRuleError).message).toBe("Booking rejected: only 2.5 PD left on order 4500012345.");
      expect((error as BusinessRuleError).values).toEqual({ orderId: "4500012345", freePersonDays: 2.5 });
    }
  });
});

describe("overlapping bookings rule", () => {
  const morning = { startTime: "09:00", endTime: "12:00" };

  test("accepts a booking that only touches another one", () => {
    expect(() => assertNoOverlap([morning], { startTime: "12:00", endTime: "15:00" })).not.toThrow();
    expect(() => assertNoOverlap([morning], { startTime: "07:00", endTime: "09:00" })).not.toThrow();
  });

  test("accepts a booking when the day is empty", () => {
    expect(() => assertNoOverlap([], morning)).not.toThrow();
  });

  test("rejects a booking that overlaps the end of another one", () => {
    expect(() => assertNoOverlap([morning], { startTime: "11:00", endTime: "13:00" })).toThrow(BusinessRuleError);
  });

  test("rejects a booking that overlaps the start of another one", () => {
    expect(() => assertNoOverlap([morning], { startTime: "08:00", endTime: "09:30" })).toThrow(BusinessRuleError);
  });

  test("rejects a booking inside or around another one", () => {
    expect(() => assertNoOverlap([morning], { startTime: "10:00", endTime: "11:00" })).toThrow(BusinessRuleError);
    expect(() => assertNoOverlap([morning], { startTime: "08:00", endTime: "13:00" })).toThrow(BusinessRuleError);
  });

  test("uses the wording of story #5", () => {
    expect(() => assertNoOverlap([morning], morning)).toThrow("Booking rejected: overlaps with an existing booking.");
  });
});

describe("10-hour day rule", () => {
  const bookedToday = [{ startTime: "08:00", endTime: "16:30", hours: 8.5 }];

  test("accepts a booking that reaches exactly 10 h", () => {
    expect(() => assertWithinDailyLimit(bookedToday, 1.5)).not.toThrow();
  });

  test("rejects a booking that goes above 10 h, in the words of story #7", () => {
    expect(() => assertWithinDailyLimit(bookedToday, 2)).toThrow(
      "Booking rejected: more than 10 h per day is not allowed (ArbZG §3).",
    );
  });

  test("adds up several bookings, without decimal errors", () => {
    const threeBookings = [
      { startTime: "08:00", endTime: "11:30", hours: 3.3 },
      { startTime: "11:30", endTime: "15:00", hours: 3.3 },
    ];

    expect(() => assertWithinDailyLimit(threeBookings, 3.4)).not.toThrow();
    expect(() => assertWithinDailyLimit(threeBookings, 3.41)).toThrow(BusinessRuleError);
  });

  test("rejects a single booking above 10 h on an empty day", () => {
    expect(() => assertWithinDailyLimit([], 10.5)).toThrow(BusinessRuleError);
  });
});

describe("11-hour rest rule", () => {
  const startsAtEight = { startTime: "08:00", endTime: "12:00" };

  test("accepts exactly 11 h since the previous day", () => {
    expect(() => assertRestPeriod([{ startTime: "12:00", endTime: "21:00" }], [], startsAtEight)).not.toThrow();
  });

  test("rejects less than 11 h since the previous day, in the words of story #6", () => {
    expect(() => assertRestPeriod([{ startTime: "12:00", endTime: "22:00" }], [], startsAtEight)).toThrow(
      "Booking rejected: less than 11 h rest since the last working day (ArbZG §5).",
    );
  });

  test("rejects one minute too little", () => {
    expect(() => assertRestPeriod([{ startTime: "12:00", endTime: "21:01" }], [], startsAtEight)).toThrow(BusinessRuleError);
  });

  test("checks the latest booking of the previous day, whatever the order", () => {
    const previousDay = [
      { startTime: "18:00", endTime: "22:00" },
      { startTime: "09:00", endTime: "12:00" },
    ];

    expect(() => assertRestPeriod(previousDay, [], startsAtEight)).toThrow(BusinessRuleError);
  });

  const endsAtNine = { startTime: "14:00", endTime: "21:00" };

  test("accepts exactly 11 h before the next day", () => {
    expect(() => assertRestPeriod([], [{ startTime: "08:00", endTime: "12:00" }], endsAtNine)).not.toThrow();
  });

  test("rejects less than 11 h before the next day", () => {
    expect(() => assertRestPeriod([], [{ startTime: "07:59", endTime: "12:00" }], endsAtNine)).toThrow(
      "Booking rejected: less than 11 h rest before the next working day (ArbZG §5).",
    );
  });

  test("accepts a booking when the days around it are empty", () => {
    expect(() => assertRestPeriod([], [], startsAtEight)).not.toThrow();
  });
});

describe("addDays", () => {
  test("crosses the end of a month and of a year", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2027-01-01", -1)).toBe("2026-12-31");
  });
});

describe("assigned order rule", () => {
  test("accepts a consultant assigned to the order", () => {
    expect(() => assertAssignedToOrder(true, order)).not.toThrow();
  });

  test("rejects a consultant not assigned to the order", () => {
    expect(() => assertAssignedToOrder(false, order)).toThrow(BusinessRuleError);
  });
});

describe("calculateBudget", () => {
  test("counts 8 booked hours as 1 person-day", () => {
    expect(calculateBudget({ ...order, orderedPersonDays: 140 }, 7)).toEqual({
      orderedPersonDays: 140,
      usedPersonDays: 0.875,
      freePersonDays: 139.125,
    });
  });
});
