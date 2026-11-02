// The weekly email digest for a project lead (issue #64): which orders get one, and which warnings it carries.
// Sending it needs the lead's explicit opt-in, which the service checks before anything here runs.
import { addDays, HOURS_PER_PERSON_DAY } from "./booking.ts";
import type { BookedDay } from "./forecast.ts";
import { isoWeekOf } from "./forecast.ts";

export const DIGEST_WINDOW_DAYS = 7;

export type IsoWeek = { year: number; week: number };

export type DigestForecast =
  | { status: "not-enough-data" }
  | {
      status: "ok";
      exhaustionWeek: IsoWeek | null;
      warning: { orderByWeek: IsoWeek; isOverdue: boolean; followUpPersonDays: number } | null;
    };

export type DigestWarning =
  | { kind: "budget-used-up" }
  | { kind: "order-more"; orderByWeek: IsoWeek; isOverdue: boolean; followUpPersonDays: number }
  | { kind: "follow-up-open"; personDays: number };

export type OrderDigest = {
  orderId: string;
  title: string;
  isoWeek: string;
  weekStart: string;
  weekEnd: string;
  orderedPersonDays: number;
  usedPersonDays: number;
  freePersonDays: number;
  weekPersonDays: number;
  forecast: DigestForecast;
  warnings: DigestWarning[];
};

// The 7 days before the day the job runs, so a Monday run covers Monday to Sunday of the week before.
export function digestWeekOf(today: string) {
  return { weekStart: addDays(today, -DIGEST_WINDOW_DAYS), weekEnd: addDays(today, -1) };
}

// The week a digest belongs to, such as 2026-W45. A digest is sent at most once per order and week.
export function isoWeekLabel(date: string) {
  const { year, week } = isoWeekOf(date);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

export function hoursInDigestWeek(bookedDays: BookedDay[], today: string) {
  const { weekStart, weekEnd } = digestWeekOf(today);
  return bookedDays.filter(({ date }) => weekStart <= date && date <= weekEnd).reduce((total, { hours }) => total + hours, 0);
}

// An order nobody booked on last week has no news, so it gets no digest.
export function needsDigest(bookedDays: BookedDay[], today: string) {
  return hoursInDigestWeek(bookedDays, today) > 0;
}

export function listDigestWarnings(freePersonDays: number, forecast: DigestForecast, openFollowUp: { personDays: number } | null): DigestWarning[] {
  const warnings: DigestWarning[] = [];
  if (freePersonDays <= 0) warnings.push({ kind: "budget-used-up" });
  if (forecast.status === "ok" && forecast.warning) warnings.push({ kind: "order-more", ...forecast.warning });
  if (openFollowUp) warnings.push({ kind: "follow-up-open", personDays: openFollowUp.personDays });
  return warnings;
}

type OrderDigestInput = {
  today: string;
  order: { id: string; title: string };
  budget: { orderedPersonDays: number; usedPersonDays: number; freePersonDays: number };
  bookedDays: BookedDay[];
  forecast: DigestForecast;
  openFollowUp: { personDays: number } | null;
};

export function buildOrderDigest({ today, order, budget, bookedDays, forecast, openFollowUp }: OrderDigestInput): OrderDigest {
  return {
    orderId: order.id,
    title: order.title,
    isoWeek: isoWeekLabel(today),
    ...digestWeekOf(today),
    ...budget,
    weekPersonDays: hoursInDigestWeek(bookedDays, today) / HOURS_PER_PERSON_DAY,
    forecast,
    warnings: listDigestWarnings(budget.freePersonDays, forecast, openFollowUp),
  };
}
