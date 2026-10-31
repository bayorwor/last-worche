// A BookingRepository that keeps data in memory, so unit tests run without a database.
import type { Order } from "../domain/booking.ts";
import { RECENT_BOOKINGS_LIMIT, type BookingRepository, type NewBooking, type StoredBooking } from "./bookingRepository.ts";

export type InMemoryAssignment = { consultantId: string; orderId: string };
export type InMemoryOrder = Order & { projectLeadId?: string };

function newestFirst(first: StoredBooking, second: StoredBooking) {
  return `${second.date} ${second.startTime}`.localeCompare(`${first.date} ${first.startTime}`);
}

export function createInMemoryBookingRepository(orders: InMemoryOrder[], assignments: InMemoryAssignment[]): BookingRepository {
  const bookings: StoredBooking[] = [];

  const findOrder = async (orderId: string) => orders.find((order) => order.id === orderId) ?? null;
  const sumBookedHours = async (orderId: string) =>
    bookings.filter((booking) => booking.orderId === orderId).reduce((total, booking) => total + booking.hours, 0);

  const toSummary = (order: Order) => ({ id: order.id, title: `Order ${order.id}` });

  const isConsultantAssigned = async (consultantId: string, orderId: string) =>
    assignments.some((a) => a.consultantId === consultantId && a.orderId === orderId);

  return {
    listOrders: async () => orders.map(toSummary),
    listOrdersLedBy: async (userId) => orders.filter((order) => order.projectLeadId === userId).map(toSummary),
    isConsultantAssigned,
    isOrderLedBy: async (userId, orderId) => orders.some((order) => order.id === orderId && order.projectLeadId === userId),
    listRecentBookingsOfConsultant: async (consultantId) =>
      bookings
        .filter((booking) => booking.consultantId === consultantId)
        .sort(newestFirst)
        .slice(0, RECENT_BOOKINGS_LIMIT),
    listRecentBookingsOfOrder: async (orderId) =>
      bookings
        .filter((booking) => booking.orderId === orderId)
        .sort(newestFirst)
        .slice(0, RECENT_BOOKINGS_LIMIT)
        .map((booking) => ({ ...booking, consultantName: booking.consultantId })),
    listAssignedOrders: async (consultantId) =>
      orders
        .filter((order) => assignments.some((a) => a.consultantId === consultantId && a.orderId === order.id))
        .map(toSummary),
    findOrder,
    sumBookedHours,
    transaction: (work) =>
      work({
        findOrderForUpdate: findOrder,
        isConsultantAssigned,
        sumBookedHours,
        lockConsultant: async () => {},
        findBookingsOnDate: async (consultantId, date) =>
          bookings
            .filter((booking) => booking.consultantId === consultantId && booking.date === date)
            .map(({ startTime, endTime, hours }) => ({ startTime, endTime, hours })),
        saveBooking: async (booking: NewBooking) => {
          const stored = { id: bookings.length + 1, ...booking };
          bookings.push(stored);
          return stored;
        },
      }),
  };
}
