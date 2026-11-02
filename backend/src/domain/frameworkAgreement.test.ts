import { describe, expect, test } from "bun:test";
import { BusinessRuleError } from "./errors.ts";
import { assertFitsFrameworkAgreement, summariseFrameworkAgreements } from "./frameworkAgreement.ts";

const agreement = { id: "fa-1", title: "IT consulting", totalPersonDays: 60 };

describe("assertFitsFrameworkAgreement", () => {
  test("accepts an amount that fits the agreement", () => {
    expect(() => assertFitsFrameworkAgreement(agreement, 50, 5)).not.toThrow();
  });

  test("accepts exactly the free amount", () => {
    expect(() => assertFitsFrameworkAgreement(agreement, 50, 10)).not.toThrow();
  });

  test("accepts an exact fit that binary decimals would miss", () => {
    expect(() => assertFitsFrameworkAgreement({ ...agreement, totalPersonDays: 0.3 }, 0.1, 0.2)).not.toThrow();
  });

  test("rejects more than is free, and names the agreement and the free amount", () => {
    try {
      assertFitsFrameworkAgreement(agreement, 50, 10.5);
      throw new Error("expected a rejection");
    } catch (error) {
      expect(error).toBeInstanceOf(BusinessRuleError);
      expect((error as BusinessRuleError).rule).toBe("framework-budget");
      expect((error as BusinessRuleError).message).toContain("only 10 PD free");
    }
  });
});

describe("summariseFrameworkAgreements", () => {
  const row = { agreementId: "fa-1", agreementTitle: "IT consulting", totalPersonDays: 60, supplierName: "Nordlicht Agentur" };

  test("adds up the orders that share an agreement", () => {
    const [summary] = summariseFrameworkAgreements([
      { ...row, orderId: "1", title: "Reports", orderedPersonDays: 20, bookedHours: 156 },
      { ...row, orderId: "2", title: "Portal", orderedPersonDays: 30, bookedHours: 40 },
    ]);

    expect(summary).toMatchObject({ totalPersonDays: 60, orderedPersonDays: 50, freePersonDays: 10, usedPersonDays: 24.5 });
    expect(summary?.orders.map(({ orderId }) => orderId)).toEqual(["1", "2"]);
  });

  test("keeps separate agreements apart", () => {
    const summaries = summariseFrameworkAgreements([
      { ...row, orderId: "1", title: "Reports", orderedPersonDays: 20, bookedHours: 0 },
      { ...row, agreementId: "fa-2", orderId: "2", title: "Portal", orderedPersonDays: 30, bookedHours: 0 },
    ]);

    expect(summaries.map(({ id }) => id)).toEqual(["fa-1", "fa-2"]);
  });

  test("returns no person and no day", () => {
    const [summary] = summariseFrameworkAgreements([{ ...row, orderId: "1", title: "Reports", orderedPersonDays: 20, bookedHours: 8 }]);

    expect(JSON.stringify(summary)).not.toMatch(/consultant|date/i);
  });
});
