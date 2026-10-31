// Business rules for bookings. Plain functions with no Express or database code, so they are easy to test.
import { BusinessRuleError } from "./errors.ts";

export const HOURS_PER_PERSON_DAY = 8;

export type Order = {
  id: string;
  orderedPersonDays: number;
};

export type TimeRange = {
  startTime: string; // HH:MM
  endTime: string; // HH:MM
};

export function calculateBudget(order: Order, bookedHours: number) {
  const usedPersonDays = bookedHours / HOURS_PER_PERSON_DAY;
  return {
    orderedPersonDays: order.orderedPersonDays,
    usedPersonDays,
    freePersonDays: order.orderedPersonDays - usedPersonDays,
  };
}

// Touching is fine: one booking may end at 12:00 and the next start at 12:00.
// HH:MM strings sort in time order, so they can be compared directly.
export function assertNoOverlap(existingBookings: TimeRange[], newBooking: TimeRange) {
  const overlapping = existingBookings.find(
    (existing) => newBooking.startTime < existing.endTime && existing.startTime < newBooking.endTime,
  );
  if (overlapping) {
    throw new BusinessRuleError("no-overlap", "Booking rejected: overlaps with an existing booking.", {
      startTime: overlapping.startTime,
      endTime: overlapping.endTime,
    });
  }
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
      `Booking rejected: only ${freePersonDays} PD left on order ${order.id}.`,
      { orderId: order.id, freePersonDays },
    );
  }
}
