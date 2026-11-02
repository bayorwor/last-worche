import { beforeEach, describe, expect, test } from "bun:test";
import { ForbiddenError, NotFoundError } from "../domain/errors.ts";
import type { User } from "../domain/user.ts";
import type { BookingRepository } from "../repositories/bookingRepository.ts";
import { createInMemoryBookingRepository } from "../repositories/inMemoryBookingRepository.ts";
import { createRadarService, type RadarService } from "./radarService.ts";

const ORDER_ID = "4500012345";
const OTHER_ORDER_ID = "4500012346";
const NOW = Date.parse("2026-11-06T12:00:00Z");
const lead: User = { id: "lead-1", name: "A. Weber", email: "a@test.example", role: "project_lead", consultantId: null };
const otherLead: User = { ...lead, id: "lead-2" };
const buyer: User = { ...lead, id: "buyer-1", role: "purchasing" };

let repository: BookingRepository;
let radar: RadarService;

function store(orderId: string, consultantId: string, date: string, hours: number) {
  return repository.transaction((transaction) =>
    transaction.saveBooking({ orderId, consultantId, date, startTime: "08:00", endTime: "18:00", hours, description: "Work" }),
  );
}

beforeEach(async () => {
  repository = createInMemoryBookingRepository([
    { id: ORDER_ID, orderedPersonDays: 140, projectLeadId: lead.id, supplierName: "Consultis GmbH" },
    { id: OTHER_ORDER_ID, orderedPersonDays: 20, projectLeadId: otherLead.id, supplierName: "Nordlicht Agentur" },
  ], []);
  radar = createRadarService(repository, () => NOW);
  for (const date of ["2026-11-04", "2026-11-05", "2026-11-06"]) await store(ORDER_ID, "consultant-1", date, 10);
  await store(ORDER_ID, "consultant-1", "2026-11-01", 3); // a Sunday
});

describe("the order radar", () => {
  test("shows the project lead each flag with the consultant and the days", async () => {
    const result = await radar.getOrderRadarFor(lead, ORDER_ID);

    expect(result.evaluatedOn).toBe("2026-11-06");
    expect(result.flags.map(({ kind, consultantId, days }) => ({ kind, consultantId, days }))).toEqual([
      { kind: "frequent-long-days", consultantId: "consultant-1", days: ["2026-11-04", "2026-11-05", "2026-11-06"] },
      { kind: "weekend-work", consultantId: "consultant-1", days: ["2026-11-01"] },
    ]);
  });

  test("rejects purchasing and the lead of another order", async () => {
    await expect(radar.getOrderRadarFor(buyer, ORDER_ID)).rejects.toThrow(ForbiddenError);
    await expect(radar.getOrderRadarFor(otherLead, ORDER_ID)).rejects.toThrow(ForbiddenError);
  });

  test("rejects an unknown order", async () => {
    await expect(radar.getOrderRadarFor(lead, "4500099999")).rejects.toThrow(NotFoundError);
  });
});

describe("the supplier radar for purchasing", () => {
  test("returns only counts per supplier, with no person, day or hour", async () => {
    const result = await radar.getSupplierRadar();

    expect(result.suppliers).toEqual([
      { supplierName: "Consultis GmbH", frequentLongDays: 1, weekendWork: 1, paceJumps: 0, justUnderLimit: 0 },
      { supplierName: "Nordlicht Agentur", frequentLongDays: 0, weekendWork: 0, paceJumps: 0, justUnderLimit: 0 },
    ]);
    expect(JSON.stringify(result)).not.toContain("consultant-1");
    expect(JSON.stringify(result)).not.toContain("2026-11-04");
  });
});
