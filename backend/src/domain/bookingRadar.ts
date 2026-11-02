// The radar for unusual booking patterns (issue #66). It rejects nothing: every booking here already passed the
// rules. It points the project lead at patterns worth a second look before the invoice check, not after it.
import { addDays, HOURS_PER_PERSON_DAY } from "./booking.ts";
import { isWeekend } from "./forecast.ts";

export const LONG_DAY_HOURS = 10; // the ArbZG limit, so a long day is a day at the limit
export const LONG_DAY_WINDOW_DAYS = 5;
export const LONG_DAY_MIN_COUNT = 3;
export const RECENT_WINDOW_DAYS = 28; // how far back weekend work and bookings at the budget limit are looked for
export const PACE_BASELINE_WEEKS = 4;
export const PACE_JUMP_FACTOR = 1.5;
export const PACE_JUMP_MIN_HOURS = HOURS_PER_PERSON_DAY; // a jump must add at least a person-day a week
export const JUST_UNDER_FREE_HOURS = 2; // a booking that leaves less than a quarter person-day free

export type RadarBooking = { id: number; consultantId: string; consultantName: string; date: string; hours: number };

export type RadarFlagKind = "frequent-long-days" | "weekend-work" | "pace-jump" | "just-under-limit";

export type RadarFlag = {
  kind: RadarFlagKind;
  consultantId: string;
  consultantName: string;
  days: string[];
  // Only the figures that explain this kind of flag.
  details: Record<string, number>;
};

export type RadarInput = { today: string; orderedPersonDays: number; bookings: RadarBooking[] };

const round = (hours: number) => Math.round(hours * 100) / 100;

function groupByConsultant(bookings: RadarBooking[]) {
  const groups = new Map<string, RadarBooking[]>();
  for (const booking of bookings) {
    groups.set(booking.consultantId, [...(groups.get(booking.consultantId) ?? []), booking]);
  }
  return [...groups.values()];
}

function hoursPerDay(bookings: RadarBooking[]) {
  const days = new Map<string, number>();
  for (const { date, hours } of bookings) days.set(date, (days.get(date) ?? 0) + hours);
  return days;
}

function sumHoursBetween(bookings: RadarBooking[], first: string, last: string) {
  return bookings.filter(({ date }) => first <= date && date <= last).reduce((total, { hours }) => total + hours, 0);
}

function flagOf(kind: RadarFlagKind, booking: RadarBooking, days: string[], details: Record<string, number> = {}): RadarFlag {
  return { kind, consultantId: booking.consultantId, consultantName: booking.consultantName, days, details };
}

// Days at the 10-hour limit on at least 3 of the last 5 calendar days, today included.
export function findFrequentLongDays(bookings: RadarBooking[], today: string) {
  const firstDay = addDays(today, -(LONG_DAY_WINDOW_DAYS - 1));
  return groupByConsultant(bookings).flatMap((own) => {
    const longDays = [...hoursPerDay(own)]
      .filter(([date, hours]) => firstDay <= date && date <= today && round(hours) >= LONG_DAY_HOURS)
      .map(([date]) => date)
      .sort();
    return longDays.length >= LONG_DAY_MIN_COUNT ? [flagOf("frequent-long-days", own[0] as RadarBooking, longDays, { count: longDays.length })] : [];
  });
}

export function findWeekendWork(bookings: RadarBooking[], today: string) {
  const firstDay = addDays(today, -(RECENT_WINDOW_DAYS - 1));
  return groupByConsultant(bookings).flatMap((own) => {
    const weekendDays = [...new Set(own.map(({ date }) => date))].filter((date) => firstDay <= date && date <= today && isWeekend(date)).sort();
    return weekendDays.length > 0 ? [flagOf("weekend-work", own[0] as RadarBooking, weekendDays)] : [];
  });
}

// The last 7 days against the average week of the 4 weeks before. Someone new has no usual pace, so is not flagged.
export function findPaceJumps(bookings: RadarBooking[], today: string) {
  const weekStart = addDays(today, -6);
  const baselineStart = addDays(weekStart, -7 * PACE_BASELINE_WEEKS);
  return groupByConsultant(bookings).flatMap((own) => {
    const recentHours = round(sumHoursBetween(own, weekStart, today));
    const usualWeeklyHours = round(sumHoursBetween(own, baselineStart, addDays(weekStart, -1)) / PACE_BASELINE_WEEKS);
    const isJump = usualWeeklyHours > 0 && recentHours >= usualWeeklyHours * PACE_JUMP_FACTOR && recentHours - usualWeeklyHours >= PACE_JUMP_MIN_HOURS;
    return isJump ? [flagOf("pace-jump", own[0] as RadarBooking, [weekStart, today], { recentHours, usualWeeklyHours })] : [];
  });
}

// A booking that takes the order's budget to less than a quarter person-day free. Bookings are replayed in the
// order they were stored, against today's ordered budget, so a budget raised later hides earlier ones.
export function findBookingsJustUnderLimit(bookings: RadarBooking[], orderedPersonDays: number, today: string) {
  const firstDay = addDays(today, -(RECENT_WINDOW_DAYS - 1));
  let freeHours = orderedPersonDays * HOURS_PER_PERSON_DAY;
  const flags: RadarFlag[] = [];
  for (const booking of [...bookings].sort((first, second) => first.id - second.id)) {
    const freeHoursBefore = round(freeHours);
    freeHours -= booking.hours;
    if (firstDay <= booking.date && booking.date <= today && round(freeHours) < JUST_UNDER_FREE_HOURS) {
      flags.push(flagOf("just-under-limit", booking, [booking.date], { hours: booking.hours, freeHoursBefore }));
    }
  }
  return flags;
}

export function findUnusualPatterns({ today, orderedPersonDays, bookings }: RadarInput): RadarFlag[] {
  return [
    ...findFrequentLongDays(bookings, today),
    ...findWeekendWork(bookings, today),
    ...findPaceJumps(bookings, today),
    ...findBookingsJustUnderLimit(bookings, orderedPersonDays, today),
  ];
}

// What purchasing may see: how many flags of each kind per supplier, and no person, day or hour (story #13).
export function countFlagsPerSupplier(suppliers: { supplierName: string; flags: RadarFlag[] }[]) {
  const names = [...new Set(suppliers.map(({ supplierName }) => supplierName))];
  return names.map((supplierName) => {
    const flags = suppliers.filter((supplier) => supplier.supplierName === supplierName).flatMap((supplier) => supplier.flags);
    const count = (kind: RadarFlagKind) => flags.filter((flag) => flag.kind === kind).length;
    return {
      supplierName,
      frequentLongDays: count("frequent-long-days"),
      weekendWork: count("weekend-work"),
      paceJumps: count("pace-jump"),
      justUnderLimit: count("just-under-limit"),
    };
  });
}
