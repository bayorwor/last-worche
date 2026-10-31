// What purchasing may see: totals per order and supplier, and nothing about a person or a day (story #13).
import { calculateBudget } from "./booking.ts";

// An order counts as needing a follow-up order once 10% or less of its budget is free. This is a simple
// stand-in until the budget forecast exists (stories #10 and #14).
export const FOLLOW_UP_FREE_SHARE = 0.1;

export type OrderTotals = {
  orderId: string;
  title: string;
  supplierId: string;
  supplierName: string;
  orderedPersonDays: number;
  bookedHours: number;
};

export function needsFollowUpOrder(orderedPersonDays: number, freePersonDays: number) {
  return freePersonDays <= orderedPersonDays * FOLLOW_UP_FREE_SHARE;
}

export function summariseSuppliers(orders: OrderTotals[]) {
  const orderSummaries = orders.map((order) => {
    const budget = calculateBudget({ id: order.orderId, orderedPersonDays: order.orderedPersonDays }, order.bookedHours);
    return {
      supplierId: order.supplierId,
      supplierName: order.supplierName,
      orderId: order.orderId,
      title: order.title,
      ...budget,
      needsFollowUpOrder: needsFollowUpOrder(budget.orderedPersonDays, budget.freePersonDays),
    };
  });

  const supplierIds = [...new Set(orderSummaries.map((order) => order.supplierId))];

  return supplierIds.map((supplierId) => {
    const supplierOrders = orderSummaries.filter((order) => order.supplierId === supplierId);
    const sum = (read: (order: (typeof supplierOrders)[number]) => number) =>
      supplierOrders.reduce((total, order) => total + read(order), 0);

    return {
      supplierName: supplierOrders[0]?.supplierName ?? "",
      orderCount: supplierOrders.length,
      orderedPersonDays: sum((order) => order.orderedPersonDays),
      usedPersonDays: sum((order) => order.usedPersonDays),
      freePersonDays: sum((order) => order.freePersonDays),
      needsFollowUpOrder: supplierOrders.some((order) => order.needsFollowUpOrder),
      orders: supplierOrders.map(({ supplierId: _supplierId, supplierName: _supplierName, ...order }) => order),
    };
  });
}
