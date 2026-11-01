import { describe, expect, test } from "bun:test";
import { BusinessRuleError } from "./errors.ts";
import { assertMonthNotApproved, assertProofCanBeApproved, monthOf, toProofOfWork, assertProofApprovedForExport, toProofCsv } from "./proofOfWork.ts";

describe("toProofCsv", () => {
  const row = { date: "2026-10-27", consultantName: "L. Hoffmann", startTime: "09:00", endTime: "17:00", hours: 7, description: "Work" };

  test("has a header and one line per booking", () => {
    const lines = toProofCsv("4500012345", "2026-10", [row]).split("\r\n");

    expect(lines[0]).toStartWith('"Order";"Month";"Date"');
    expect(lines[1]).toBe('"4500012345";"2026-10";"2026-10-27";"L. Hoffmann";"09:00";"17:00";"7";"0.875";"Work"');
  });

  test("escapes quotes and keeps semicolons inside their cell", () => {
    expect(toProofCsv("1", "2026-10", [{ ...row, description: 'a "b"; c' }])).toContain('"a ""b""; c"');
  });

  test("stops a description from running as a spreadsheet formula", () => {
    expect(toProofCsv("1", "2026-10", [{ ...row, description: "=HYPERLINK(1)" }])).toContain('"\'=HYPERLINK(1)"');
  });
});

describe("assertProofApprovedForExport", () => {
  test("accepts an approved month", () => {
    expect(() => assertProofApprovedForExport(true, "2026-10")).not.toThrow();
  });

  test("rejects a month that is not approved, because only approved hours go to finance", () => {
    expect(() => assertProofApprovedForExport(false, "2026-10")).toThrow("not approved yet");
  });
});

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
