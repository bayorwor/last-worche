import { beforeEach, describe, expect, test } from "bun:test";
import { BusinessRuleError, NotFoundError } from "../domain/errors.ts";
import type { User } from "../domain/user.ts";
import { createInMemoryActivityRepository } from "../repositories/inMemoryActivityRepository.ts";
import { createInMemoryBookingRepository } from "../repositories/inMemoryBookingRepository.ts";
import { createBookingService } from "./bookingService.ts";
import { createProofOfWorkService } from "./proofOfWorkService.ts";
import { createPurchasingService, type PurchasingService } from "./purchasingService.ts";

const ORDER_ID = "4500012345";
const lead: User = { id: "lead-1", name: "A. Weber", email: "a@test.example", role: "project_lead", consultantId: null };
const buyer: User = { ...lead, id: "buyer-1", role: "purchasing" };
const invoice = { orderId: ORDER_ID, month: "2026-10", invoiceNumber: "RE-1001", invoicedPersonDays: 1 };

describe("stored invoices", () => {
  let purchasing: PurchasingService;
  let activities: ReturnType<typeof createInMemoryActivityRepository>;

  beforeEach(async () => {
    const orders = [{ id: ORDER_ID, orderedPersonDays: 10, projectLeadId: lead.id }];
    activities = createInMemoryActivityRepository([lead, buyer], orders);
    const repository = createInMemoryBookingRepository(orders, [{ consultantId: "consultant-1", orderId: ORDER_ID }], activities);
    purchasing = createPurchasingService(repository, () => 1000);

    // One 8-hour day in October, approved, and nothing in November.
    await createBookingService(repository).createBooking({ orderId: ORDER_ID, consultantId: "consultant-1", date: "2026-10-05", startTime: "09:00", endTime: "17:00", hours: 8, description: "Work" });
    await createProofOfWorkService(repository).approveFor(lead, ORDER_ID, "2026-10");
  });

  test("stores an invoice with its difference from the approved month", async () => {
    await purchasing.recordInvoice(buyer, { ...invoice, invoicedPersonDays: 1.5 });

    expect(await purchasing.listInvoices()).toMatchObject([
      { orderId: ORDER_ID, month: "2026-10", invoiceNumber: "RE-1001", status: "over-approved", approvedPersonDays: 1, invoicedPersonDays: 1.5, differencePersonDays: 0.5 },
    ]);
  });

  test("an invoice matching the approved month is consistent", async () => {
    await purchasing.recordInvoice(buyer, invoice);

    expect(await purchasing.listInvoices()).toMatchObject([{ status: "consistent", differencePersonDays: 0 }]);
  });

  test("storing is logged for the person who did it", async () => {
    await purchasing.recordInvoice(buyer, invoice);

    expect((await activities.listOwn(buyer.id)).map(({ type }) => type)).toContain("invoice_recorded");
  });

  test("rejects a month without an approved proof of work, and stores nothing", async () => {
    await expect(purchasing.recordInvoice(buyer, { ...invoice, month: "2026-11" })).rejects.toThrow("No approved proof of work");

    expect(await purchasing.listInvoices()).toEqual([]);
  });

  test("rejects a second invoice for the same order and month, even with another number", async () => {
    await purchasing.recordInvoice(buyer, invoice);

    await expect(purchasing.recordInvoice(buyer, { ...invoice, invoiceNumber: "RE-1002" })).rejects.toThrow(BusinessRuleError);
    expect(await purchasing.listInvoices()).toHaveLength(1);
  });

  test("an unknown order is not found", async () => {
    await expect(purchasing.recordInvoice(buyer, { ...invoice, orderId: "missing" })).rejects.toThrow(NotFoundError);
  });
});
