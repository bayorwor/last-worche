// Use cases for bookings: loads data, applies the domain rules, stores the result.
import { assertFitsFreeBudget, calculateBudget } from "../domain/booking.ts";
import { NotFoundError } from "../domain/errors.ts";
import type { CreateBookingRequest, OrderBudgetResponse } from "../dtos/bookingDtos.ts";
import type { BookingRepository } from "../repositories/bookingRepository.ts";

export type BookingService = ReturnType<typeof createBookingService>;

export function createBookingService(repository: BookingRepository) {
  return {
    // The check and the insert share one transaction that locks the order, so two bookings
    // arriving at the same moment cannot both use the same free budget.
    createBooking(request: CreateBookingRequest) {
      return repository.transaction(async (transaction) => {
        const order = await transaction.findOrderForUpdate(request.orderId);
        if (!order) throw new NotFoundError(`Order ${request.orderId} does not exist.`);

        assertFitsFreeBudget(order, await transaction.sumBookedHours(order.id), request.hours);
        return transaction.saveBooking(request);
      });
    },

    async getOrderBudget(orderId: string): Promise<OrderBudgetResponse> {
      const order = await repository.findOrder(orderId);
      if (!order) throw new NotFoundError(`Order ${orderId} does not exist.`);

      return { orderId: order.id, ...calculateBudget(order, await repository.sumBookedHours(order.id)) };
    },
  };
}
