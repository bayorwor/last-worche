// Use cases for bookings: loads data, applies the domain rules, stores the result.
import { assertAssignedToOrder, assertFitsFreeBudget, assertNoOverlap, assertWithinDailyLimit, calculateBudget } from "../domain/booking.ts";
import { NotFoundError } from "../domain/errors.ts";
import type { CreateBookingRequest, OrderBudgetResponse } from "../dtos/bookingDtos.ts";
import type { BookingRepository } from "../repositories/bookingRepository.ts";

export type BookingService = ReturnType<typeof createBookingService>;

export function createBookingService(repository: BookingRepository) {
  return {
    // The checks and the insert share one transaction that locks the order and the consultant, so two
    // bookings arriving at the same moment cannot both use the same free budget or the same hours.
    createBooking(request: CreateBookingRequest) {
      return repository.transaction(async (transaction) => {
        const order = await transaction.findOrderForUpdate(request.orderId);
        if (!order) throw new NotFoundError(`Order ${request.orderId} does not exist.`);

        // Both locks come before the first plain read. MySQL fixes a transaction's view of the data at that
        // read, so a check after it could miss a booking saved while this transaction waited for a lock.
        await transaction.lockConsultant(request.consultantId);

        assertAssignedToOrder(await transaction.isConsultantAssigned(request.consultantId, order.id), order);
        assertFitsFreeBudget(order, await transaction.sumBookedHours(order.id), request.hours);

        const bookingsOnDay = await transaction.findBookingsOnDate(request.consultantId, request.date);
        assertNoOverlap(bookingsOnDay, request);
        assertWithinDailyLimit(bookingsOnDay, request.hours);

        return transaction.saveBooking(request);
      });
    },

    listOrders() {
      return repository.listOrders();
    },

    listAssignedOrders(consultantId: string) {
      return repository.listAssignedOrders(consultantId);
    },

    async getOrderBudget(orderId: string): Promise<OrderBudgetResponse> {
      const order = await repository.findOrder(orderId);
      if (!order) throw new NotFoundError(`Order ${orderId} does not exist.`);

      return { orderId: order.id, ...calculateBudget(order, await repository.sumBookedHours(order.id)) };
    },
  };
}
