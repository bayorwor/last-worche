// Fictional sample data for the demo. No real people or companies.
import type { NewBooking } from "./bookingRepository.ts";

export const SEED_ORDER_ID = "4500012345";
export const NEAR_LIMIT_ORDER_ID = "4500012346"; // only 0.5 PT free, to show the free-budget rule rejecting a booking

export const DEMO_CONSULTANT_ID = "consultant-1";

export const ACCOUNTING_OBJECTS = [
  { id: "CC-4711", name: "IT applications" },
  { id: "CC-4820", name: "Finance systems" },
];

export const SUPPLIERS = [
  { id: "supplier-1", name: "Consultis GmbH" },
  { id: "supplier-2", name: "Nordlicht Agentur" },
];

export const CONSULTANTS = [
  { id: DEMO_CONSULTANT_ID, name: "L. Hoffmann", supplierId: "supplier-1" },
  { id: "consultant-2", name: "M. Krüger", supplierId: "supplier-1" },
  { id: "consultant-3", name: "S. Tanriver", supplierId: "supplier-2" },
];

export const ORDERS = [
  { id: SEED_ORDER_ID, title: "Customer portal migration", orderedPersonDays: 140, accountingObjectId: "CC-4711" },
  { id: NEAR_LIMIT_ORDER_ID, title: "Reporting platform", orderedPersonDays: 20, accountingObjectId: "CC-4820" },
];

// consultant-2 is not assigned to the near-limit order, to show the assignment guard rejecting a booking.
export const ASSIGNMENTS = [
  { consultantId: DEMO_CONSULTANT_ID, orderId: SEED_ORDER_ID },
  { consultantId: DEMO_CONSULTANT_ID, orderId: NEAR_LIMIT_ORDER_ID },
  { consultantId: "consultant-2", orderId: SEED_ORDER_ID },
  { consultantId: "consultant-3", orderId: NEAR_LIMIT_ORDER_ID },
];

// One per role. They have no password yet, because sign-in does not exist (ADR-0002).
export const DEMO_USERS = [
  { id: "user-consultant", name: "L. Hoffmann", role: "consultant", consultantId: DEMO_CONSULTANT_ID },
  { id: "user-project-lead", name: "A. Weber", role: "project_lead", consultantId: null },
  { id: "user-purchasing", name: "K. Vogel", role: "purchasing", consultantId: null },
];

// Migration 004 gives these their start and end times.
type DemoBooking = Omit<NewBooking, "startTime" | "endTime">;

const FIRST_DEMO_DAY = "2026-08-17";

function nextWeekdays(count: number): string[] {
  const days: string[] = [];
  const day = new Date(`${FIRST_DEMO_DAY}T00:00:00Z`);
  while (days.length < count) {
    if (day.getUTCDay() !== 0 && day.getUTCDay() !== 6) {
      days.push(day.toISOString().slice(0, 10));
    }
    day.setUTCDate(day.getUTCDate() + 1);
  }
  return days;
}

// 84 PT on the first order, as in story #9, and 19.5 of 20 PT on the second. All in the past,
// with at most 8 h per person and day, so demo bookings for today never collide with them.
export function buildDemoBookings(): DemoBooking[] {
  const fullDay = (orderId: string, consultantId: string, date: string, description: string) => ({
    orderId,
    consultantId,
    date,
    hours: 8,
    description,
  });

  return [
    ...nextWeekdays(42).flatMap((date) => [
      fullDay(SEED_ORDER_ID, DEMO_CONSULTANT_ID, date, "Legacy data reconciliation"),
      fullDay(SEED_ORDER_ID, "consultant-2", date, "Customer portal development"),
    ]),
    ...nextWeekdays(19).map((date) => fullDay(NEAR_LIMIT_ORDER_ID, "consultant-3", date, "Report development")),
    { ...fullDay(NEAR_LIMIT_ORDER_ID, "consultant-3", "2026-09-11", "Report review"), hours: 4 },
  ];
}
