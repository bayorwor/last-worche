// Business rules for bookings. Plain functions with no Express or database code, so they are easy to test.
import { BusinessRuleError } from "./errors.ts";

export const HOURS_PER_PERSON_DAY = 8;

export type Order = {
  id: string;
  orderedPersonDays: number;
};

export function calculateBudget(order: Order, bookedHours: number) {
  const usedPersonDays = bookedHours / HOURS_PER_PERSON_DAY;
  return {
    orderedPersonDays: order.orderedPersonDays,
    usedPersonDays,
    freePersonDays: order.orderedPersonDays - usedPersonDays,
  };
}

export function assertAssignedToOrder(isAssigned: boolean, order: Order) {
  if (!isAssigned) {
    throw new BusinessRuleError("assigned-order", `Booking rejected: you are not assigned to order ${order.id}.`, {
      orderId: order.id,
    });
  }
}

export function assertFitsFreeBudget(order: Order, bookedHours: number, newHours: number) {
  const { freePersonDays } = calculateBudget(order, bookedHours);
  if (newHours / HOURS_PER_PERSON_DAY > freePersonDays) {
    throw new BusinessRuleError(
      "free-budget",
      `This booking needs ${newHours} h, but order ${order.id} only has ${freePersonDays} person-days free.`,
      { hours: newHours, orderId: order.id, freePersonDays },
    );
  }
}
