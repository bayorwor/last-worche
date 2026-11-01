// What the services need from storage. Services depend on these types, not on MySQL.
import type { NewActivity } from "../domain/activity.ts";
import type { ConsultantCalendar, DateRange, DayBooking, Order } from "../domain/booking.ts";
import type { ProofOfWorkTotals } from "../domain/proofOfWork.ts";
import type { OrderTotals } from "../domain/purchasing.ts";

export type BookableOrder = Order & DateRange;

export type NewBooking = {
  orderId: string;
  consultantId: string;
  date: string;
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  hours: number;
  description: string;
};

export type StoredBooking = NewBooking & { id: number };

export type OrderBooking = StoredBooking & { consultantName: string };

export const RECENT_BOOKINGS_LIMIT = 10;

export type OrderSummary = { id: string; title: string };

export type MonthApproval = {
  orderId: string;
  month: string; // YYYY-MM
  approvedByUserId: string;
  approvedAtMs: number;
};

export type BookingTransaction = {
  // Locks the order until the transaction ends, so its budget cannot change in the meantime.
  findOrderForUpdate(orderId: string): Promise<BookableOrder | null>;
  findConsultantCalendar(consultantId: string): Promise<ConsultantCalendar>;
  isConsultantAssigned(consultantId: string, orderId: string): Promise<boolean>;
  sumBookedHours(orderId: string): Promise<number>;
  // Locks the consultant until the transaction ends, so two bookings of one person on different
  // orders cannot both pass a check of that person's day. The order lock does not cover this.
  lockConsultant(consultantId: string): Promise<void>;
  findBookingsOnDate(consultantId: string, date: string): Promise<DayBooking[]>;
  saveBooking(booking: NewBooking): Promise<StoredBooking>;
  isMonthApproved(orderId: string, month: string): Promise<boolean>;
  countBookingsInMonth(orderId: string, month: string): Promise<number>;
  approveMonth(approval: MonthApproval): Promise<void>;
  // Part of the transaction, so a rejected booking or approval is never logged.
  recordActivity(activity: NewActivity): Promise<void>;
  recordBookingCreated(booking: NewBooking, occurredAtMs: number): Promise<void>;
};

export type BookingRepository = {
  listOrders(): Promise<OrderSummary[]>;
  listOrderTotals(): Promise<OrderTotals[]>;
  listProofsOfWork(orderId: string): Promise<ProofOfWorkTotals[]>;
  listAssignedOrders(consultantId: string): Promise<OrderSummary[]>;
  listOrdersLedBy(userId: string): Promise<OrderSummary[]>;
  isConsultantAssigned(consultantId: string, orderId: string): Promise<boolean>;
  isOrderLedBy(userId: string, orderId: string): Promise<boolean>;
  listRecentBookingsOfConsultant(consultantId: string): Promise<StoredBooking[]>;
  listRecentBookingsOfOrder(orderId: string): Promise<OrderBooking[]>;
  findOrder(orderId: string): Promise<Order | null>;
  sumBookedHours(orderId: string): Promise<number>;
  // Commits if `work` succeeds and rolls everything back if it throws.
  transaction<T>(work: (transaction: BookingTransaction) => Promise<T>): Promise<T>;
};
