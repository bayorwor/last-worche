// Use cases for bookings: loads data, applies the domain rules, stores the result.
import {
  addDays,
  assertAssignedToOrder,
  assertFitsFreeBudget,
  assertNoOverlap,
  assertRestPeriod,
  assertWithinDailyLimit,
  calculateBudget,
} from "../domain/booking.ts";
import { ForbiddenError, NotFoundError } from "../domain/errors.ts";
import { assertMonthNotApproved, monthOf } from "../domain/proofOfWork.ts";
import type { User } from "../domain/user.ts";
import type { OrderBudgetResponse } from "../dtos/bookingDtos.ts";
import type { BookingRepository, NewBooking } from "../repositories/bookingRepository.ts";

export type BookingService = ReturnType<typeof createBookingService>;

export function createBookingService(repository: BookingRepository) {
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

        assertAssignedToOrder(await transaction.isConsultantAssigned(request.consultantId, order.id), order);
        assertMonthNotApproved(await transaction.isMonthApproved(order.id, monthOf(request.date)));
        assertFitsFreeBudget(order, await transaction.sumBookedHours(order.id), request.hours);

        const bookingsOnDay = await transaction.findBookingsOnDate(request.consultantId, request.date);
        assertNoOverlap(bookingsOnDay, request);
        assertWithinDailyLimit(bookingsOnDay, request.hours);
        assertRestPeriod(
          await transaction.findBookingsOnDate(request.consultantId, addDays(request.date, -1)),
          await transaction.findBookingsOnDate(request.consultantId, addDays(request.date, 1)),
          request,
        );

        return transaction.saveBooking(request);
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
