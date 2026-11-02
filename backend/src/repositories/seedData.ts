// Fictional sample data for the demo. No real people or companies.
import type { NewBooking } from "./bookingRepository.ts";

export const SEED_ORDER_ID = "4500012345";
export const SECOND_LEAD_ORDER_ID = "4500012347"; // led by another project lead, to show that leads only see their own orders
export const NEAR_LIMIT_ORDER_ID = "4500012346"; // only 0.5 PT free, to show the free-budget rule rejecting a booking

export const DEMO_CONSULTANT_ID = "consultant-1";
export const DEMO_PROJECT_LEAD_ID = "user-project-lead";

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

// The first users, kept as they were because migration 002 reads this list. TEST_USERS has all of them.
export const DEMO_USERS = [
  { id: "user-consultant", name: "L. Hoffmann", role: "consultant", consultantId: DEMO_CONSULTANT_ID },
  { id: DEMO_PROJECT_LEAD_ID, name: "A. Weber", role: "project_lead", consultantId: null },
  { id: "user-purchasing", name: "K. Vogel", role: "purchasing", consultantId: null },
];

export const ROLES = [
  {
    id: "consultant",
    nameDe: "Berater",
    nameEn: "Consultant",
    summaryDe: "Lieferantenseite · buchen",
    summaryEn: "Supplier side · book time",
  },
  {
    id: "project_lead",
    nameDe: "Projektleitung",
    nameEn: "Project lead",
    summaryDe: "Kundenseite · prüfen & steuern",
    summaryEn: "Client side · review & steer",
  },
  {
    id: "purchasing",
    nameDe: "Einkauf",
    nameEn: "Purchasing",
    summaryDe: "Kundenseite · nur Summen",
    summaryEn: "Client side · totals only",
  },
];

// Only for migration 006. Migration 007 removes the passwords again, in favour of sign-in codes (ADR-0014).
export const TEST_PASSWORD = "lastWorche-Test-2026";

// Every person is fictional, and .example addresses can never reach a real mailbox.
export const TEST_USERS = [
  { id: "user-consultant", name: "L. Hoffmann", email: "l.hoffmann@consultis.example", role: "consultant", consultantId: DEMO_CONSULTANT_ID },
  { id: "user-consultant-2", name: "M. Krüger", email: "m.krueger@consultis.example", role: "consultant", consultantId: "consultant-2" },
  { id: "user-consultant-3", name: "S. Tanriver", email: "s.tanriver@nordlicht.example", role: "consultant", consultantId: "consultant-3" },
  { id: DEMO_PROJECT_LEAD_ID, name: "A. Weber", email: "a.weber@client.example", role: "project_lead", consultantId: null },
  { id: "user-project-lead-2", name: "J. Schneider", email: "j.schneider@client.example", role: "project_lead", consultantId: null },
  { id: "user-purchasing", name: "K. Vogel", email: "k.vogel@client.example", role: "purchasing", consultantId: null },
];

export const SECOND_LEAD_ORDER = {
  id: SECOND_LEAD_ORDER_ID,
  title: "Supplier portal rollout",
  orderedPersonDays: 30,
  accountingObjectId: "CC-4711",
  projectLeadId: "user-project-lead-2",
};

export const SECOND_LEAD_ORDER_CONSULTANT_ID = "consultant-3";

// Which supplier each order was given to.
export const ORDER_SUPPLIERS = [
  { orderId: SEED_ORDER_ID, supplierId: "supplier-1" },
  { orderId: NEAR_LIMIT_ORDER_ID, supplierId: "supplier-2" },
  { orderId: SECOND_LEAD_ORDER_ID, supplierId: "supplier-2" },
];

// Long-term contracts whose total budget several orders share. Nordlicht's two orders reserve 50 of its 60 PD.
export const FRAMEWORK_AGREEMENTS = [
  { id: "RV-2026-001", supplierId: "supplier-1", title: "IT consulting 2026", totalPersonDays: 200, orderIds: [SEED_ORDER_ID] },
  { id: "RV-2026-002", supplierId: "supplier-2", title: "Reporting and portals 2026", totalPersonDays: 60, orderIds: [NEAR_LIMIT_ORDER_ID, SECOND_LEAD_ORDER_ID] },
];

// More than Nordlicht's agreement has free, to show purchasing's confirmation being rejected.
export const OVER_AGREEMENT_FOLLOW_UP = { orderId: NEAR_LIMIT_ORDER_ID, personDays: 15, neededByDate: "2026-12-01", requestedAtMs: Date.UTC(2026, 9, 26, 9) };

// One working week, right after this consultant's bookings on the near-limit order.
export const SECOND_LEAD_ORDER_DAYS = ["2026-09-14", "2026-09-15", "2026-09-16", "2026-09-17", "2026-09-18"];

// When each order may be booked on. The project of the first order runs a month longer than the order,
// which is what the budget forecast warns about (stories #12 and #14).
export const ORDER_PERIODS = [
  { orderId: SEED_ORDER_ID, startDate: "2026-07-01", endDate: "2026-12-31", projectEndDate: "2027-01-29" },
  { orderId: NEAR_LIMIT_ORDER_ID, startDate: "2026-07-01", endDate: "2026-12-31", projectEndDate: "2026-12-31" },
  { orderId: SECOND_LEAD_ORDER_ID, startDate: "2026-09-01", endDate: "2027-03-31", projectEndDate: "2027-03-31" },
];

// Different states, to show that a holiday only counts where the consultant works (story #8).
export const CONSULTANT_STATES = [
  { consultantId: DEMO_CONSULTANT_ID, federalState: "BY" },
  { consultantId: "consultant-2", federalState: "HH" },
  { consultantId: "consultant-3", federalState: "NW" },
];

export const VACATIONS = [
  { consultantId: DEMO_CONSULTANT_ID, startDate: "2026-12-21", endDate: "2026-12-24" },
  { consultantId: "consultant-2", startDate: "2026-11-16", endDate: "2026-11-20" },
];

// The client's company holidays, when nobody books. The forecast counts them as lost days (story #10).
export const SHUTDOWNS = [{ startDate: "2026-12-24", endDate: "2027-01-01" }];

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
