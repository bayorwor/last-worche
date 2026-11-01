import { describe, expect, test } from "bun:test";
import { BusinessRuleError } from "./errors.ts";
import { assertProofApprovedForInvoice, checkInvoice } from "./invoiceCheck.ts";

describe("checkInvoice", () => {
  test("flags an invoice above the approved hours, with the difference", () => {
    expect(checkInvoice(42, 44.5)).toEqual({ status: "over-approved", approvedPersonDays: 42, invoicedPersonDays: 44.5, differencePersonDays: 2.5 });
  });

  test("marks a matching invoice as consistent", () => {
    expect(checkInvoice(42, 42).status).toBe("consistent");
  });

  test("flags an invoice below the approved hours", () => {
    expect(checkInvoice(42, 40)).toMatchObject({ status: "under-approved", differencePersonDays: -2 });
  });

  test("is not fooled by tiny decimal errors", () => {
    expect(checkInvoice(0.1 + 0.2, 0.3).status).toBe("consistent");
  });
});

describe("assertProofApprovedForInvoice", () => {
  test("accepts a month with an approved proof of work", () => {
    expect(() => assertProofApprovedForInvoice(42, "4500012345", "2026-10")).not.toThrow();
  });

  test("rejects a month with no approved proof of work", () => {
    expect(() => assertProofApprovedForInvoice(null, "4500012345", "2026-10")).toThrow(BusinessRuleError);
    expect(() => assertProofApprovedForInvoice(null, "4500012345", "2026-10")).toThrow("ask the project lead to approve it first");
  });
});
