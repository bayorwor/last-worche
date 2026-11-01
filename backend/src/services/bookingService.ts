// Use cases for bookings: loads data, applies the domain rules, stores the result.
import {
  addDays,
  assertAssignedToOrder,
  assertConsultantOfSupplier,
  assertNotDuplicate,
  assertOrderOfSupplier,
  assertFitsFreeBudget,
  assertInsideOrderPeriod,
  assertNoOverlap,
  assertNotOnPublicHoliday,
  assertNotOnVacation,
  assertRestPeriod,
  assertWithinDailyLimit,
  calculateBudget,
  suggestFreeSlot,
} from "../domain/booking.ts";
import { BusinessRuleError, ForbiddenError, NotFoundError } from "../domain/errors.ts";
import { assertMonthNotApproved, monthOf } from "../domain/proofOfWork.ts";
import type { User } from "../domain/user.ts";
import type { OrderBudgetResponse } from "../dtos/bookingDtos.ts";
import type { BookableOrder, BookingRepository, BookingTransaction, NewBooking } from "../repositories/bookingRepository.ts";

export type BookingService = ReturnType<typeof createBookingService>;

// The one list of rules. Saving stops at the first rejection, and the check before saving runs them all.
async function listBookingRules(transaction: BookingTransaction, order: BookableOrder, request: NewBooking) {
  const { federalState, vacations } = await transaction.findConsultantCalendar(request.consultantId);
  const bookingsOnDay = await transaction.findBookingsOnDate(request.consultantId, request.date);

  return [
    {
      name: "assigned-order",
      run: async () => assertAssignedToOrder(await transaction.isConsultantAssigned(request.consultantId, order.id), order),
    },
    { name: "order-period", run: async () => assertInsideOrderPeriod(order, request.date) },
    {
      name: "approved-month",
      run: async () => assertMonthNotApproved(await transaction.isMonthApproved(order.id, monthOf(request.date))),
    },
    { name: "free-budget", run: async () => assertFitsFreeBudget(order, await transaction.sumBookedHours(order.id), request.hours) },
    { name: "vacation", run: async () => assertNotOnVacation(vacations, request.date) },
    { name: "public-holiday", run: async () => assertNotOnPublicHoliday(federalState, request.date) },
    { name: "no-overlap", run: async () => assertNoOverlap(bookingsOnDay, request) },
    { name: "daily-limit", run: async () => assertWithinDailyLimit(bookingsOnDay, request.hours) },
    {
      name: "rest-period",
      run: async () =>
        assertRestPeriod(
          await transaction.findBookingsOnDate(request.consultantId, addDays(request.date, -1)),
          await transaction.findBookingsOnDate(request.consultantId, addDays(request.date, 1)),
          request,
        ),
    },
  ];
}

export function createBookingService(repository: BookingRepository, now: () => number = Date.now) {
  // A project lead reaches the orders they lead, a consultant their assigned orders,
  // and purchasing all orders, because this only covers aggregated values.
  async function canReadOrderAggregates(user: User, orderId: string) {
    if (user.role === "purchasing") return true;
    if (user.role === "project_lead") return repository.isOrderLedBy(user.id, orderId);
    return user.consultantId !== null && repository.isConsultantAssigned(user.consultantId, orderId);
  }

  async function getOrderBudget(orderId: string): Promise<OrderBudgetResponse> {
    const order = await repository.findOrder(orderId);
    if (!order) throw new NotFoundError(`Order ${orderId} does not exist.`);

    return { orderId: order.id, ...calculateBudget(order, await repository.sumBookedHours(order.id)) };
  }

  return {
    // The checks and the insert share one transaction that locks the order and the consultant, so two
    // bookings arriving at the same moment cannot both use the same free budget or the same hours.
    createBooking(request: NewBooking) {
      return repository.transaction(async (transaction) => {
        const order = await transaction.findOrderForUpdate(request.orderId);
        if (!order) throw new NotFoundError(`Order ${request.orderId} does not exist.`);

        // Both locks come before the first plain read. MySQL fixes a transaction's view of the data at that
        // read, so a check after it could miss a booking saved while this transaction waited for a lock.
        await transaction.lockConsultant(request.consultantId);

        for (const rule of await listBookingRules(transaction, order, request)) {
          await rule.run();
        }

        const booking = await transaction.saveBooking(request);
        await transaction.recordBookingCreated(request, now());
        return booking;
      });
    },

    // A batch from a supplier's own time tracking. It is one transaction, so either every row is stored or none.
    // Each row passes the same rules as a booking made by hand, and also sees the rows before it.
    importBookings(supplierId: string, rows: NewBooking[]) {
      return repository.transaction(async (transaction) => {
        // Always locked in the same order, so two batches cannot wait for each other forever.
        const orderIds = [...new Set(rows.map(({ orderId }) => orderId))].sort();
        const consultantIds = [...new Set(rows.map(({ consultantId }) => consultantId))].sort();
        const orders = new Map(await Promise.all(orderIds.map(async (id) => [id, await transaction.findOrderForUpdate(id)] as const)));
        for (const id of consultantIds) await transaction.lockConsultant(id);

        const saved = [];
        for (const [index, row] of rows.entries()) {
          try {
            assertConsultantOfSupplier(await transaction.findConsultantSupplierId(row.consultantId), supplierId, row.consultantId);
            assertOrderOfSupplier(await transaction.findOrderSupplierId(row.orderId), supplierId, row.orderId);
            assertNotDuplicate(await transaction.hasSameBooking(row));

            const order = orders.get(row.orderId) as BookableOrder;
            for (const rule of await listBookingRules(transaction, order, row)) {
              await rule.run();
            }
            saved.push(await transaction.saveBooking(row));
            await transaction.recordBookingCreated(row, now());
          } catch (error) {
            if (!(error instanceof BusinessRuleError)) throw error;
            const rowNumber = index + 1;
            throw new BusinessRuleError(error.rule, `Row ${rowNumber}: ${error.message} Nothing from this batch was stored.`, { ...error.values, row: rowNumber });
          }
        }
        return { imported: saved.length, bookingIds: saved.map(({ id }) => id) };
      });
    },

    // Runs every rule without storing anything, so the person sees all problems at once and what the booking
    // would do to the budget. Saving runs the same rules again, because the data can change in between.
    checkBooking(request: NewBooking) {
      return repository.transaction(async (transaction) => {
        const order = await transaction.findOrderForUpdate(request.orderId);
        if (!order) throw new NotFoundError(`Order ${request.orderId} does not exist.`);
        await transaction.lockConsultant(request.consultantId);

        const checks = [];
        for (const rule of await listBookingRules(transaction, order, request)) {
          try {
            await rule.run();
            checks.push({ name: rule.name, passed: true });
          } catch (error) {
            if (!(error instanceof BusinessRuleError)) throw error;
            checks.push({ name: rule.name, passed: false, rule: error.rule, values: error.values, message: error.message });
          }
        }

        const overlapFailed = checks.some((check) => check.name === "no-overlap" && !check.passed);
        const bookingsOnDay = await transaction.findBookingsOnDate(request.consultantId, request.date);
        const bookedHours = await transaction.sumBookedHours(order.id);
        return {
          checks,
          freePersonDaysAfter: calculateBudget(order, bookedHours + request.hours).freePersonDays,
          suggestedSlot: overlapFailed ? suggestFreeSlot(bookingsOnDay, request) : null,
        };
      });
    },

    // Row-level scope: each role only ever receives the orders it may see.
    listOrdersFor(user: User) {
      if (user.role === "purchasing") return repository.listOrders();
      if (user.role === "project_lead") return repository.listOrdersLedBy(user.id);
      return user.consultantId ? repository.listAssignedOrders(user.consultantId) : Promise.resolve([]);
    },

    listAssignedOrders(consultantId: string) {
      return repository.listAssignedOrders(consultantId);
    },

    getOrderBudget,

    async getOrderBudgetFor(user: User, orderId: string) {
      const budget = await getOrderBudget(orderId); // an unknown order is 404, before asking about access
      if (!(await canReadOrderAggregates(user, orderId))) {
        throw new ForbiddenError(`You may not see order ${orderId}.`);
      }
      return budget;
    },

    // Single bookings are personal data: only the project lead of the order may read them.
    async listOrderBookingsFor(user: User, orderId: string) {
      if (!(await repository.findOrder(orderId))) throw new NotFoundError(`Order ${orderId} does not exist.`);
      if (user.role !== "project_lead" || !(await repository.isOrderLedBy(user.id, orderId))) {
        throw new ForbiddenError(`You may not see the bookings of order ${orderId}.`);
      }
      return repository.listRecentBookingsOfOrder(orderId);
    },

    // A consultant reads their own bookings only.
    async listConsultantBookingsFor(user: User, consultantId: string) {
      if (user.consultantId !== consultantId) {
        throw new ForbiddenError("You may only see your own bookings.");
      }
      return repository.listRecentBookingsOfConsultant(consultantId);
    },
  };
}
