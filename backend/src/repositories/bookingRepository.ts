// What the services need from storage. Services depend on these types, not on MySQL.
import type { Order } from "../domain/booking.ts";

export type NewBooking = {
  orderId: string;
  consultantId: string;
  date: string;
  hours: number;
  description: string;
};

export type StoredBooking = NewBooking & { id: number };

export type BookingTransaction = {
  // Locks the order until the transaction ends, so its budget cannot change in the meantime.
  findOrderForUpdate(orderId: string): Promise<Order | null>;
  sumBookedHours(orderId: string): Promise<number>;
  saveBooking(booking: NewBooking): Promise<StoredBooking>;
};

export type BookingRepository = {
  findOrder(orderId: string): Promise<Order | null>;
  sumBookedHours(orderId: string): Promise<number>;
  // Commits if `work` succeeds and rolls everything back if it throws.
  transaction<T>(work: (transaction: BookingTransaction) => Promise<T>): Promise<T>;
};
