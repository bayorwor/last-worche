import { beforeEach, describe, expect, spyOn, test } from "bun:test";
import { ForbiddenError } from "../domain/errors.ts";
import type { User } from "../domain/user.ts";
import type { BookingRepository } from "../repositories/bookingRepository.ts";
import { createInMemoryBookingRepository } from "../repositories/inMemoryBookingRepository.ts";
import { createInMemoryDigestRepository, type InMemoryDigestRepository } from "../repositories/inMemoryDigestRepository.ts";
import { createDigestService, type DigestService } from "./digestService.ts";
import type { Email } from "./emailService.ts";
import { createForecastService } from "./forecastService.ts";

const ORDER_ID = "4500012345";
const QUIET_ORDER_ID = "4500012346";
const NOW = Date.parse("2026-11-09T07:00:00Z"); // a Monday
const lead: User = { id: "lead-1", name: "A. Weber", email: "a.weber@test.example", role: "project_lead", consultantId: null };
const otherLead: User = { ...lead, id: "lead-2", name: "J. Schneider", email: "j.schneider@test.example" };
const buyer: User = { ...lead, id: "buyer-1", role: "purchasing" };

let bookings: BookingRepository;
let digests: InMemoryDigestRepository;
let sent: Email[];
let service: DigestService;

function store(orderId: string, date: string, hours = 8) {
  return bookings.transaction((transaction) =>
    transaction.saveBooking({ orderId, consultantId: "consultant-1", date, startTime: "09:00", endTime: "17:00", hours, description: "Work" }),
  );
}

beforeEach(async () => {
  bookings = createInMemoryBookingRepository([
    // The story's order: 140 PD ordered, 84 PD used, and a project end the budget will not reach.
    { id: ORDER_ID, orderedPersonDays: 140, projectLeadId: lead.id, projectEndDate: "2027-06-30" },
    { id: QUIET_ORDER_ID, orderedPersonDays: 20, projectLeadId: lead.id },
  ], []);
  digests = createInMemoryDigestRepository([lead, otherLead, buyer]);
  sent = [];
  service = createDigestService({
    digests,
    bookings,
    forecasts: createForecastService(bookings, () => NOW),
    sendEmail: async (email) => {
      sent.push(email);
    },
    now: () => NOW,
  });
  await store(ORDER_ID, "2026-09-01", 84 * 8 - 40);
  for (const date of ["2026-11-02", "2026-11-03", "2026-11-04", "2026-11-05", "2026-11-06"]) await store(ORDER_ID, date);
  await store(QUIET_ORDER_ID, "2026-10-01");
});

describe("opting in", () => {
  test("nobody is subscribed until they turn it on", async () => {
    expect(await service.getSubscriptionFor(lead)).toEqual({ subscribed: false });
  });

  test("a project lead turns it on and off for themselves", async () => {
    await service.setSubscriptionFor(lead, true);
    expect(await service.getSubscriptionFor(lead)).toEqual({ subscribed: true });
    expect(await service.getSubscriptionFor(otherLead)).toEqual({ subscribed: false });

    await service.setSubscriptionFor(lead, false);
    expect(await service.getSubscriptionFor(lead)).toEqual({ subscribed: false });
  });

  test("rejects anyone who is not a project lead", async () => {
    await expect(service.setSubscriptionFor(buyer, true)).rejects.toThrow(ForbiddenError);
  });
});

describe("the weekly job", () => {
  test("sends nothing to a project lead who never opted in, in the words of issue #64", async () => {
    expect(await service.sendWeeklyDigests()).toEqual({ sent: 0, alreadySent: 0, failed: 0 });
    expect(sent).toEqual([]);
  });

  test("sends a subscribed lead one email per order booked last week, with budget, exhaustion week and warning", async () => {
    await service.setSubscriptionFor(lead, true);

    expect(await service.sendWeeklyDigests()).toEqual({ sent: 1, alreadySent: 0, failed: 0 });

    expect(sent).toHaveLength(1);
    expect(sent[0]?.to).toBe("a.weber@test.example");
    expect(sent[0]?.subject).toContain(ORDER_ID);
    expect(sent[0]?.text).toContain("Verbraucht: 84,0 PT · Frei: 56,0 PT");
    expect(sent[0]?.text).toContain("Used: 84.0 PD · Free: 56.0 PD");
    expect(sent[0]?.text).toContain("Booked in this period: 5.0 PD");
    expect(sent[0]?.text).toMatch(/Budget expected to run out in week \d+\/\d{4}/);
    expect(sent[0]?.text).toMatch(/Order more by week \d+\/\d{4}: the budget will not last until the project end/);
  });

  test("sends each order's digest only once per week, however often the job runs", async () => {
    await service.setSubscriptionFor(lead, true);
    await service.sendWeeklyDigests();

    expect(await service.sendWeeklyDigests()).toEqual({ sent: 0, alreadySent: 1, failed: 0 });
    expect(sent).toHaveLength(1);
  });

  test("does not note a failed email as sent, so the next run tries again", async () => {
    await service.setSubscriptionFor(lead, true);
    const errorLog = spyOn(console, "error").mockImplementation(() => {});
    const failing = createDigestService({
      digests,
      bookings,
      forecasts: createForecastService(bookings, () => NOW),
      sendEmail: async () => {
        throw new Error("mail server down");
      },
      now: () => NOW,
    });

    expect(await failing.sendWeeklyDigests()).toEqual({ sent: 0, alreadySent: 0, failed: 1 });
    expect(digests.deliveries).toEqual([]);
    errorLog.mockRestore();
  });
});
