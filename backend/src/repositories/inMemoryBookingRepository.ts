// A BookingRepository that keeps data in memory, so unit tests run without a database.
import type { Order } from "../domain/booking.ts";
import type { BookingRepository, NewBooking, StoredBooking } from "./bookingRepository.ts";

export function createInMemoryBookingRepository(orders: Order[]): BookingRepository {
  const bookings: StoredBooking[] = [];

  const findOrder = async (orderId: string) => orders.find((order) => order.id === orderId) ?? null;
  const sumBookedHours = async (orderId: string) =>
    bookings.filter((booking) => booking.orderId === orderId).reduce((total, booking) => total + booking.hours, 0);

  return {
    findOrder,
    sumBookedHours,
    transaction: (work) =>
      work({
        findOrderForUpdate: findOrder,
        sumBookedHours,
        saveBooking: async (booking: NewBooking) => {
          const stored = { id: bookings.length + 1, ...booking };
          bookings.push(stored);
          return stored;
        },
      }),
  };
}
