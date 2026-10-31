import { describe, expect, test } from "bun:test";
import { BusinessRuleError } from "./errors.ts";
import { assertMonthNotApproved, assertProofCanBeApproved, monthOf, toProofOfWork } from "./proofOfWork.ts";

describe("approved month rule", () => {
  test("accepts a booking in a month that is still open", () => {
    expect(() => assertMonthNotApproved(false)).not.toThrow();
  });

  test("rejects a booking in an approved month, in the words of story #11", () => {
    expect(() => assertMonthNotApproved(true)).toThrow("Proof of work already approved — contact the project lead.");
  });
});

describe("approving a proof of work", () => {
  test("accepts a month with bookings", () => {
    expect(() => assertProofCanBeApproved("2026-10", 3, false)).not.toThrow();
  });

  test("rejects a month with no bookings", () => {
    expect(() => assertProofCanBeApproved("2026-10", 0, false)).toThrow(BusinessRuleError);
  });

  test("rejects approving the same month twice", () => {
    expect(() => assertProofCanBeApproved("2026-10", 3, true)).toThrow(BusinessRuleError);
  });
});

describe("toProofOfWork", () => {
  const totals = { month: "2026-10", bookedHours: 12, bookingCount: 2, consultantCount: 1, approvedAtMs: null, approvedByName: null };

  test("counts 8 hours as 1 person-day, and an unapproved month as open", () => {
    expect(toProofOfWork(totals)).toMatchObject({ personDays: 1.5, status: "open" });
  });

  test("marks an approved month", () => {
    expect(toProofOfWork({ ...totals, approvedAtMs: 1, approvedByName: "A. Weber" }).status).toBe("approved");
  });
});

test("monthOf takes the year and month of a date", () => {
  expect(monthOf("2026-10-31")).toBe("2026-10");
});
