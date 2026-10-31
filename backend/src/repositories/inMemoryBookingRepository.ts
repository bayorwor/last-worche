// A BookingRepository that keeps data in memory, so unit tests run without a database.
import type { Order } from "../domain/booking.ts";
import { monthOf } from "../domain/proofOfWork.ts";
import {
  RECENT_BOOKINGS_LIMIT,
  type BookingRepository,
  type MonthApproval,
  type NewBooking,
  type StoredBooking,
} from "./bookingRepository.ts";

export type InMemoryAssignment = { consultantId: string; orderId: string };
export type InMemoryOrder = Order & { projectLeadId?: string; supplierId?: string; supplierName?: string };

function newestFirst(first: StoredBooking, second: StoredBooking) {
  return `${second.date} ${second.startTime}`.localeCompare(`${first.date} ${first.startTime}`);
}

export function createInMemoryBookingRepository(orders: InMemoryOrder[], assignments: InMemoryAssignment[]): BookingRepository {
  const bookings: StoredBooking[] = [];
  const approvals: MonthApproval[] = [];

  // Stands in for the names of the users table.
  const LEAD_NAMES: Record<string, string> = { "lead-1": "A. Weber", "lead-2": "J. Schneider" };

  const findOrder = async (orderId: string) => orders.find((order) => order.id === orderId) ?? null;
  const sumBookedHours = async (orderId: string) =>
    bookings.filter((booking) => booking.orderId === orderId).reduce((total, booking) => total + booking.hours, 0);

  const toSummary = (order: Order) => ({ id: order.id, title: `Order ${order.id}` });

  const isConsultantAssigned = async (consultantId: string, orderId: string) =>
    assignments.some((a) => a.consultantId === consultantId && a.orderId === orderId);

  return {
    listOrders: async () => orders.map(toSummary),
    listProofsOfWork: async (orderId) => {
      const orderBookings = bookings.filter((booking) => booking.orderId === orderId);
      const months = [...new Set(orderBookings.map((booking) => monthOf(booking.date)))].sort().reverse();
      return months.map((month) => {
        const monthBookings = orderBookings.filter((booking) => monthOf(booking.date) === month);
        const approval = approvals.find((a) => a.orderId === orderId && a.month === month);
        return {
          month,
          bookedHours: monthBookings.reduce((total, booking) => total + booking.hours, 0),
          bookingCount: monthBookings.length,
          consultantCount: new Set(monthBookings.map((booking) => booking.consultantId)).size,
          approvedAtMs: approval?.approvedAtMs ?? null,
          approvedByName: approval ? (LEAD_NAMES[approval.approvedByUserId] ?? approval.approvedByUserId) : null,
        };
      });
    },
    listOrderTotals: async () =>
      Promise.all(
        orders.map(async (order) => ({
          orderId: order.id,
          title: `Order ${order.id}`,
          orderedPersonDays: order.orderedPersonDays,
          supplierId: order.supplierId ?? "supplier-1",
          supplierName: order.supplierName ?? "Supplier",
          bookedHours: await sumBookedHours(order.id),
        })),
      ),
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
        isMonthApproved: async (orderId, month) => approvals.some((a) => a.orderId === orderId && a.month === month),
        countBookingsInMonth: async (orderId, month) =>
          bookings.filter((booking) => booking.orderId === orderId && monthOf(booking.date) === month).length,
        approveMonth: async (approval) => {
          approvals.push(approval);
        },
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
