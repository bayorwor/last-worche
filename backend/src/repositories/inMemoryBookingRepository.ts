// A BookingRepository that keeps data in memory, so unit tests run without a database.
import type { Order } from "../domain/booking.ts";
import type { BookingRepository, NewBooking, StoredBooking } from "./bookingRepository.ts";

export type InMemoryAssignment = { consultantId: string; orderId: string };

export function createInMemoryBookingRepository(orders: Order[], assignments: InMemoryAssignment[]): BookingRepository {
  const bookings: StoredBooking[] = [];

  const findOrder = async (orderId: string) => orders.find((order) => order.id === orderId) ?? null;
  const sumBookedHours = async (orderId: string) =>
    bookings.filter((booking) => booking.orderId === orderId).reduce((total, booking) => total + booking.hours, 0);

  const toSummary = (order: Order) => ({ id: order.id, title: `Order ${order.id}` });

  return {
    listOrders: async () => orders.map(toSummary),
    listAssignedOrders: async (consultantId) =>
      orders
        .filter((order) => assignments.some((a) => a.consultantId === consultantId && a.orderId === order.id))
        .map(toSummary),
    findOrder,
    sumBookedHours,
    transaction: (work) =>
      work({
        findOrderForUpdate: findOrder,
        isConsultantAssigned: async (consultantId, orderId) =>
          assignments.some((a) => a.consultantId === consultantId && a.orderId === orderId),
        sumBookedHours,
        lockConsultant: async () => {},
        findBookingTimesOnDate: async (consultantId, date) =>
          bookings
            .filter((booking) => booking.consultantId === consultantId && booking.date === date)
            .map(({ startTime, endTime }) => ({ startTime, endTime })),
        saveBooking: async (booking: NewBooking) => {
          const stored = { id: bookings.length + 1, ...booking };
          bookings.push(stored);
          return stored;
        },
      }),
  };
}
