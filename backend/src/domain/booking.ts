// Business rules for bookings. Plain functions with no Express or database code, so they are easy to test.
import { BusinessRuleError } from "./errors.ts";

export const HOURS_PER_PERSON_DAY = 8;
export const MAX_HOURS_PER_DAY = 10; // ArbZG §3
export const MIN_REST_HOURS = 11; // ArbZG §5

const MINUTES_PER_DAY = 24 * 60;

export type Order = {
  id: string;
  orderedPersonDays: number;
};

export type TimeRange = {
  startTime: string; // HH:MM
  endTime: string; // HH:MM
};

export type DayBooking = TimeRange & { hours: number };

export function calculateBudget(order: Order, bookedHours: number) {
  const usedPersonDays = bookedHours / HOURS_PER_PERSON_DAY;
  return {
    orderedPersonDays: order.orderedPersonDays,
    usedPersonDays,
    freePersonDays: order.orderedPersonDays - usedPersonDays,
  };
}

export function minutesOfDay(time: string) {
  const [hours = 0, minutes = 0] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

// Expects and returns YYYY-MM-DD. UTC on both sides, so the result never shifts with the server's time zone.
export function addDays(date: string, days: number) {
  const shifted = new Date(`${date}T00:00:00Z`);
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return shifted.toISOString().slice(0, 10);
}

function restMinutesOvernight(endTime: string, nextStartTime: string) {
  return MINUTES_PER_DAY - minutesOfDay(endTime) + minutesOfDay(nextStartTime);
}

// Checks both directions, because a booking can also be added for a day before one that is already booked.
export function assertRestPeriod(previousDay: TimeRange[], nextDay: TimeRange[], newBooking: TimeRange) {
  const minimumMinutes = MIN_REST_HOURS * 60;

  if (previousDay.some(({ endTime }) => restMinutesOvernight(endTime, newBooking.startTime) < minimumMinutes)) {
    throw new BusinessRuleError(
      "rest-after-previous-day",
      `Booking rejected: less than ${MIN_REST_HOURS} h rest since the last working day (ArbZG §5).`,
      { minHours: MIN_REST_HOURS },
    );
  }
  if (nextDay.some(({ startTime }) => restMinutesOvernight(newBooking.endTime, startTime) < minimumMinutes)) {
    throw new BusinessRuleError(
      "rest-before-next-day",
      `Booking rejected: less than ${MIN_REST_HOURS} h rest before the next working day (ArbZG §5).`,
      { minHours: MIN_REST_HOURS },
    );
  }
}

// Hours have two decimals, so rounding stops tiny decimal errors from rejecting exactly 10 h.
export function assertWithinDailyLimit(bookingsOnDay: DayBooking[], newHours: number) {
  const totalHours = bookingsOnDay.reduce((total, booking) => total + booking.hours, newHours);
  if (Math.round(totalHours * 100) / 100 > MAX_HOURS_PER_DAY) {
    throw new BusinessRuleError(
      "daily-limit",
      `Booking rejected: more than ${MAX_HOURS_PER_DAY} h per day is not allowed (ArbZG §3).`,
      { maxHours: MAX_HOURS_PER_DAY },
    );
  }
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
