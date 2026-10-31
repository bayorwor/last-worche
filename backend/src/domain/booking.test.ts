import { describe, expect, test } from "bun:test";
import { assertAssignedToOrder, assertFitsFreeBudget, assertNoOverlap, calculateBudget } from "./booking.ts";
import { BusinessRuleError } from "./errors.ts";

const order = { id: "4500012345", orderedPersonDays: 1 };

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
