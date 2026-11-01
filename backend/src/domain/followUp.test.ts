import { describe, expect, test } from "bun:test";
import { BusinessRuleError } from "./errors.ts";
import { assertFollowUpIsOpen, assertNoOpenFollowUp } from "./followUp.ts";

describe("assertNoOpenFollowUp", () => {
  test("accepts an order with no open request", () => {
    expect(() => assertNoOpenFollowUp(false, "4500012345")).not.toThrow();
  });

  test("rejects a second open request for the same order", () => {
    expect(() => assertNoOpenFollowUp(true, "4500012345")).toThrow(BusinessRuleError);
  });
});

describe("assertFollowUpIsOpen", () => {
  test("accepts an open request", () => {
    expect(() => assertFollowUpIsOpen("open")).not.toThrow();
  });

  test("rejects a request that is already confirmed, so a budget cannot rise twice", () => {
    expect(() => assertFollowUpIsOpen("confirmed")).toThrow(BusinessRuleError);
  });
});
