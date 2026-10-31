import { describe, expect, test } from "bun:test";
import { needsFollowUpOrder, summariseSuppliers, type OrderTotals } from "./purchasing.ts";

const order = (overrides: Partial<OrderTotals>): OrderTotals => ({
  orderId: "1",
  title: "Order",
  supplierId: "supplier-1",
  supplierName: "Consultis GmbH",
  orderedPersonDays: 100,
  bookedHours: 0,
  ...overrides,
});

describe("needsFollowUpOrder", () => {
  test("accepts an order with more than 10% free", () => {
    expect(needsFollowUpOrder(100, 10.5)).toBe(false);
  });

  test("flags an order with exactly 10% free", () => {
    expect(needsFollowUpOrder(100, 10)).toBe(true);
  });
});

describe("summariseSuppliers", () => {
  test("adds up the orders of each supplier", () => {
    const suppliers = summariseSuppliers([
      order({ orderId: "1", orderedPersonDays: 100, bookedHours: 80 }),
      order({ orderId: "2", orderedPersonDays: 50, bookedHours: 40 }),
      order({ orderId: "3", supplierId: "supplier-2", supplierName: "Nordlicht Agentur", orderedPersonDays: 20 }),
    ]);

    expect(suppliers).toHaveLength(2);
    expect(suppliers[0]).toMatchObject({
      supplierName: "Consultis GmbH",
      orderCount: 2,
      orderedPersonDays: 150,
      usedPersonDays: 15,
      freePersonDays: 135,
      needsFollowUpOrder: false,
    });
    expect(suppliers[1]).toMatchObject({ supplierName: "Nordlicht Agentur", orderCount: 1, freePersonDays: 20 });
  });

  test("flags a supplier when any one of its orders needs a follow-up order", () => {
    const [supplier] = summariseSuppliers([
      order({ orderId: "1", orderedPersonDays: 100 }),
      order({ orderId: "2", orderedPersonDays: 20, bookedHours: 156 }),
    ]);

    expect(supplier?.needsFollowUpOrder).toBe(true);
    expect(supplier?.orders.map((summary) => summary.needsFollowUpOrder)).toEqual([false, true]);
  });
});
