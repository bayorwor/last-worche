import { describe, expect, test } from "bun:test";
import { assertFitsFreeBudget, calculateBudget } from "./booking.ts";
import { BusinessRuleError } from "./errors.ts";

const order = { id: "4500012345", orderedPersonDays: 1 };

describe("free budget rule", () => {
  test("accepts a booking that uses exactly the free budget", () => {
    expect(() => assertFitsFreeBudget(order, 4, 4)).not.toThrow();
  });

  test("rejects a booking beyond the free budget", () => {
    expect(() => assertFitsFreeBudget(order, 4, 4.5)).toThrow(BusinessRuleError);
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
