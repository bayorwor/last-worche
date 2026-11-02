import { beforeEach, describe, expect, test } from "bun:test";
import { BusinessRuleError, ForbiddenError, NotFoundError } from "../domain/errors.ts";
import type { User } from "../domain/user.ts";
import { createInMemoryActivityRepository } from "../repositories/inMemoryActivityRepository.ts";
import { createInMemoryBookingRepository } from "../repositories/inMemoryBookingRepository.ts";
import { createBookingService, type BookingService } from "./bookingService.ts";
import { createFollowUpService, type FollowUpService } from "./followUpService.ts";

const ORDER_ID = "4500012345";
const lead: User = { id: "lead-1", name: "A. Weber", email: "a@test.example", role: "project_lead", consultantId: null };
const otherLead: User = { ...lead, id: "lead-2" };
const buyer: User = { ...lead, id: "buyer-1", role: "purchasing" };

let followUps: FollowUpService;
let bookings: BookingService;
let activities: ReturnType<typeof createInMemoryActivityRepository>;

beforeEach(() => {
  const orders = [{ id: ORDER_ID, orderedPersonDays: 10, projectLeadId: lead.id }];
  activities = createInMemoryActivityRepository([lead, buyer], orders);
  const repository = createInMemoryBookingRepository(orders, [], activities);
  followUps = createFollowUpService(repository, () => 1000);
  bookings = createBookingService(repository);
});

describe("follow-up requests", () => {
  test("a project lead's request is listed as open, and logged", async () => {
    await followUps.request(lead, ORDER_ID, 20, "2026-12-01");

    expect(await followUps.listAll()).toMatchObject([{ orderId: ORDER_ID, personDays: 20, status: "open" }]);
    expect((await activities.listOwn(lead.id)).map(({ type }) => type)).toEqual(["follow_up_requested"]);
  });

  test("the budget does not change until purchasing confirms", async () => {
    await followUps.request(lead, ORDER_ID, 20, "2026-12-01");

    expect(await bookings.getOrderBudget(ORDER_ID)).toMatchObject({ orderedPersonDays: 10 });
  });

  test("confirming raises the budget and closes the request", async () => {
    await followUps.request(lead, ORDER_ID, 20, "2026-12-01");

    await followUps.confirm(buyer, 1);

    expect(await bookings.getOrderBudget(ORDER_ID)).toMatchObject({ orderedPersonDays: 30, freePersonDays: 30 });
    expect(await followUps.listAll()).toMatchObject([{ status: "confirmed" }]);
  });

  test("confirming also extends the order to the project end, so the new budget can be booked", async () => {
    const orders = [{ id: ORDER_ID, orderedPersonDays: 10, projectLeadId: lead.id, startDate: "2026-07-01", endDate: "2026-12-31", projectEndDate: "2027-01-29" }];
    const repository = createInMemoryBookingRepository(orders, [{ consultantId: "consultant-1", orderId: ORDER_ID }]);
    const service = createFollowUpService(repository);
    const booking = { orderId: ORDER_ID, consultantId: "consultant-1", date: "2027-01-15", startTime: "09:00", endTime: "17:00", hours: 7, description: "Work" };
    await expect(createBookingService(repository).createBooking(booking)).rejects.toThrow("outside the order period");

    await service.request(lead, ORDER_ID, 20, "2026-12-01");
    await service.confirm(buyer, 1);

    await expect(createBookingService(repository).createBooking(booking)).resolves.toMatchObject({ date: "2027-01-15" });
  });

  test("rejects a second open request for the same order", async () => {
    await followUps.request(lead, ORDER_ID, 20, "2026-12-01");

    await expect(followUps.request(lead, ORDER_ID, 5, "2026-12-01")).rejects.toThrow(BusinessRuleError);
  });

  test("a new request is possible once the last one is confirmed", async () => {
    await followUps.request(lead, ORDER_ID, 20, "2026-12-01");
    await followUps.confirm(buyer, 1);

    await expect(followUps.request(lead, ORDER_ID, 5, "2026-12-01")).resolves.toMatchObject({ status: "open" });
  });

  test("confirming twice raises the budget only once", async () => {
    await followUps.request(lead, ORDER_ID, 20, "2026-12-01");
    await followUps.confirm(buyer, 1);

    await expect(followUps.confirm(buyer, 1)).rejects.toThrow(BusinessRuleError);
    expect(await bookings.getOrderBudget(ORDER_ID)).toMatchObject({ orderedPersonDays: 30 });
  });

  test("declining closes the request, leaves the budget alone, and is logged", async () => {
    await followUps.request(lead, ORDER_ID, 20, "2026-12-01");

    await followUps.decline(buyer, 1);

    expect(await followUps.listAll()).toMatchObject([{ status: "declined" }]);
    expect(await bookings.getOrderBudget(ORDER_ID)).toMatchObject({ orderedPersonDays: 10 });
    expect((await activities.listForPurchasing(buyer.id)).map(({ type }) => type)).toContain("follow_up_declined");
  });

  test("a new request is possible once the last one is declined", async () => {
    await followUps.request(lead, ORDER_ID, 20, "2026-12-01");
    await followUps.decline(buyer, 1);

    await expect(followUps.request(lead, ORDER_ID, 5, "2026-12-01")).resolves.toMatchObject({ status: "open" });
  });

  test("a closed request cannot be declined or confirmed again", async () => {
    await followUps.request(lead, ORDER_ID, 20, "2026-12-01");
    await followUps.decline(buyer, 1);
    await expect(followUps.confirm(buyer, 1)).rejects.toThrow("already declined");

    await followUps.request(lead, ORDER_ID, 5, "2026-12-01");
    await followUps.confirm(buyer, 2);
    await expect(followUps.decline(buyer, 2)).rejects.toThrow("already confirmed");
  });

  describe("with a framework agreement", () => {
    const agreement = { id: "fa-1", title: "IT consulting", totalPersonDays: 60 };
    const secondOrderId = "4500012999";
    let service: FollowUpService;
    let budgets: BookingService;

    beforeEach(() => {
      const repository = createInMemoryBookingRepository(
        [
          { id: ORDER_ID, orderedPersonDays: 20, projectLeadId: lead.id, frameworkAgreement: agreement },
          { id: secondOrderId, orderedPersonDays: 30, projectLeadId: lead.id, frameworkAgreement: agreement },
        ],
        [],
      );
      service = createFollowUpService(repository);
      budgets = createBookingService(repository);
    });

    test("confirms an amount that fits the agreement's free budget", async () => {
      await service.request(lead, ORDER_ID, 10, "2026-12-01");

      await service.confirm(buyer, 1);

      expect(await budgets.getOrderBudget(ORDER_ID)).toMatchObject({ orderedPersonDays: 30 });
    });

    test("rejects more than the agreement has free, and changes nothing", async () => {
      await service.request(lead, ORDER_ID, 15, "2026-12-01");

      await expect(service.confirm(buyer, 1)).rejects.toThrow("only 10 PD free");

      expect(await budgets.getOrderBudget(ORDER_ID)).toMatchObject({ orderedPersonDays: 20 });
      expect(await service.listAll()).toMatchObject([{ status: "open" }]);
    });

    test("a confirmed request on one order lowers what another order can get", async () => {
      await service.request(lead, ORDER_ID, 6, "2026-12-01");
      await service.request(lead, secondOrderId, 6, "2026-12-01");
      await service.confirm(buyer, 1);

      await expect(service.confirm(buyer, 2)).rejects.toThrow("only 4 PD free");
    });

    test("a refused request can be declined, so the lead can ask again", async () => {
      await service.request(lead, ORDER_ID, 15, "2026-12-01");
      await expect(service.confirm(buyer, 1)).rejects.toThrow(BusinessRuleError);

      await service.decline(buyer, 1);

      await expect(service.request(lead, ORDER_ID, 5, "2026-12-01")).resolves.toMatchObject({ status: "open" });
    });
  });

  test("only the order's own lead may ask", async () => {
    await expect(followUps.request(otherLead, ORDER_ID, 20, "2026-12-01")).rejects.toThrow(ForbiddenError);
  });

  test("an unknown order or request is not found", async () => {
    await expect(followUps.request(lead, "missing", 20, "2026-12-01")).rejects.toThrow(NotFoundError);
    await expect(followUps.confirm(buyer, 99)).rejects.toThrow(NotFoundError);
    await expect(followUps.decline(buyer, 99)).rejects.toThrow(NotFoundError);
  });
});
