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

  test("only the order's own lead may ask", async () => {
    await expect(followUps.request(otherLead, ORDER_ID, 20, "2026-12-01")).rejects.toThrow(ForbiddenError);
  });

  test("an unknown order or request is not found", async () => {
    await expect(followUps.request(lead, "missing", 20, "2026-12-01")).rejects.toThrow(NotFoundError);
    await expect(followUps.confirm(buyer, 99)).rejects.toThrow(NotFoundError);
  });
});
