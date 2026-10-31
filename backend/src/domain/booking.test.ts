import { describe, expect, test } from "bun:test";
import { assertAssignedToOrder, assertFitsFreeBudget, calculateBudget } from "./booking.ts";
import { BusinessRuleError } from "./errors.ts";

const order = { id: "4500012345", orderedPersonDays: 1 };

describe("free budget rule", () => {
  test("accepts a booking that uses exactly the free budget", () => {
    expect(() => assertFitsFreeBudget(order, 4, 4)).not.toThrow();
  });

  test("rejects a booking beyond the free budget", () => {
    expect(() => assertFitsFreeBudget(order, 4, 4.5)).toThrow(BusinessRuleError);
  });

  test("names the values the client needs to explain the rejection", () => {
    try {
      assertFitsFreeBudget(order, 4, 4.5);
      throw new Error("expected a rejection");
    } catch (error) {
      expect((error as BusinessRuleError).values).toEqual({ hours: 4.5, orderId: order.id, freePersonDays: 0.5 });
    }
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
