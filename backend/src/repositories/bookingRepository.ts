// What the services need from storage. Services depend on these types, not on MySQL.
import type { DayBooking, Order } from "../domain/booking.ts";

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

export type OrderSummary = { id: string; title: string };

export type BookingTransaction = {
  // Locks the order until the transaction ends, so its budget cannot change in the meantime.
  findOrderForUpdate(orderId: string): Promise<Order | null>;
  isConsultantAssigned(consultantId: string, orderId: string): Promise<boolean>;
  sumBookedHours(orderId: string): Promise<number>;
  // Locks the consultant until the transaction ends, so two bookings of one person on different
  // orders cannot both pass a check of that person's day. The order lock does not cover this.
  lockConsultant(consultantId: string): Promise<void>;
  findBookingsOnDate(consultantId: string, date: string): Promise<DayBooking[]>;
  saveBooking(booking: NewBooking): Promise<StoredBooking>;
};

export type BookingRepository = {
  listOrders(): Promise<OrderSummary[]>;
  listAssignedOrders(consultantId: string): Promise<OrderSummary[]>;
  findOrder(orderId: string): Promise<Order | null>;
  sumBookedHours(orderId: string): Promise<number>;
  // Commits if `work` succeeds and rolls everything back if it throws.
  transaction<T>(work: (transaction: BookingTransaction) => Promise<T>): Promise<T>;
};
