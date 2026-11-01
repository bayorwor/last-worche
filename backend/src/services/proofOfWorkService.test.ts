import { beforeEach, describe, expect, test } from "bun:test";
import { BusinessRuleError, ForbiddenError, NotFoundError } from "../domain/errors.ts";
import type { User } from "../domain/user.ts";
import { createInMemoryBookingRepository } from "../repositories/inMemoryBookingRepository.ts";
import { createBookingService, type BookingService } from "./bookingService.ts";
import { createProofOfWorkService, type ProofOfWorkService } from "./proofOfWorkService.ts";

const ORDER_ID = "4500012345";

const lead: User = { id: "lead-1", name: "A. Weber", email: "a@test.example", role: "project_lead", consultantId: null };
const otherLead: User = { ...lead, id: "lead-2", name: "J. Schneider" };
const purchasing: User = { ...lead, id: "purchasing-1", role: "purchasing" };

const booking = {
  orderId: ORDER_ID,
  consultantId: "consultant-1",
  date: "2026-10-27",
  startTime: "09:00",
  endTime: "17:00",
  hours: 8,
  description: "Work",
};

let bookings: BookingService;
let proofs: ProofOfWorkService;

beforeEach(() => {
  const repository = createInMemoryBookingRepository(
    [{ id: ORDER_ID, orderedPersonDays: 140, projectLeadId: lead.id }],
    [
      { consultantId: "consultant-1", orderId: ORDER_ID },
      { consultantId: "consultant-2", orderId: ORDER_ID },
    ],
  );
  bookings = createBookingService(repository);
  proofs = createProofOfWorkService(repository, () => 1000);
});

describe("proofOfWorkService", () => {
  test("lists each month with its totals, newest first", async () => {
    await bookings.createBooking({ ...booking, date: "2026-09-15" });
    await bookings.createBooking(booking);
    await bookings.createBooking({ ...booking, consultantId: "consultant-2" });

    expect(await proofs.listFor(lead, ORDER_ID)).toMatchObject([
      { month: "2026-10", personDays: 2, bookingCount: 2, consultantCount: 2, status: "open" },
      { month: "2026-09", personDays: 1, bookingCount: 1, consultantCount: 1, status: "open" },
    ]);
  });

  test("approving records who approved it, and only changes that month", async () => {
    await bookings.createBooking({ ...booking, date: "2026-09-15" });
    await bookings.createBooking(booking);

    const list = await proofs.approveFor(lead, ORDER_ID, "2026-10");

    expect(list).toMatchObject([
      { month: "2026-10", status: "approved", approvedByName: "A. Weber", approvedAtMs: 1000 },
      { month: "2026-09", status: "open", approvedByName: null },
    ]);
  });

  test("rejects a new booking in an approved month, and stores nothing", async () => {
    await bookings.createBooking(booking);
    await proofs.approveFor(lead, ORDER_ID, "2026-10");

    await expect(bookings.createBooking({ ...booking, date: "2026-10-28" })).rejects.toThrow(
      "Proof of work already approved — contact the project lead.",
    );
    expect((await bookings.getOrderBudget(ORDER_ID)).usedPersonDays).toBe(1);
  });

  test("still accepts a booking in another month", async () => {
    await bookings.createBooking(booking);
    await proofs.approveFor(lead, ORDER_ID, "2026-10");

    await bookings.createBooking({ ...booking, date: "2026-11-02" });

    expect((await bookings.getOrderBudget(ORDER_ID)).usedPersonDays).toBe(2);
  });

  test("rejects approving twice, or a month with no bookings", async () => {
    await bookings.createBooking(booking);
    await proofs.approveFor(lead, ORDER_ID, "2026-10");

    await expect(proofs.approveFor(lead, ORDER_ID, "2026-10")).rejects.toThrow(BusinessRuleError);
    await expect(proofs.approveFor(lead, ORDER_ID, "2026-08")).rejects.toThrow(BusinessRuleError);
  });

  test("only the project lead of the order may read or approve", async () => {
    await bookings.createBooking(booking);

    await expect(proofs.listFor(otherLead, ORDER_ID)).rejects.toThrow(ForbiddenError);
    await expect(proofs.approveFor(otherLead, ORDER_ID, "2026-10")).rejects.toThrow(ForbiddenError);
    await expect(proofs.approveFor(purchasing, ORDER_ID, "2026-10")).rejects.toThrow(ForbiddenError);
  });

  test("an unknown order is not found", async () => {
    await expect(proofs.listFor(lead, "missing")).rejects.toThrow(NotFoundError);
  });
});

describe("exportCsvFor", () => {
  test("gives the bookings of an approved month", async () => {
    await bookings.createBooking(booking);
    await proofs.approveFor(lead, ORDER_ID, "2026-10");

    expect(await proofs.exportCsvFor(lead, ORDER_ID, "2026-10")).toContain('"2026-10-27"');
  });

  test("rejects a month that is not approved", async () => {
    await bookings.createBooking(booking);

    await expect(proofs.exportCsvFor(lead, ORDER_ID, "2026-10")).rejects.toThrow(BusinessRuleError);
  });

  test("only the order's own lead may export it", async () => {
    await expect(proofs.exportCsvFor(otherLead, ORDER_ID, "2026-10")).rejects.toThrow(ForbiddenError);
    await expect(proofs.exportCsvFor(purchasing, ORDER_ID, "2026-10")).rejects.toThrow(ForbiddenError);
  });
});
