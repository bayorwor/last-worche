// MySQL implementation of BookingRepository. Database column names stay inside this file.
import type { Pool, PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import type { DayBooking } from "../domain/booking.ts";
import {
  RECENT_BOOKINGS_LIMIT,
  type BookingRepository,
  type BookingTransaction,
  type OrderBooking,
  type OrderSummary,
  type StoredBooking,
} from "./bookingRepository.ts";

type OrderRow = RowDataPacket & { id: string; ordered_person_days: number };
type TotalRow = RowDataPacket & { total: number };
type OrderSummaryRow = RowDataPacket & OrderSummary;
type DayBookingRow = RowDataPacket & DayBooking;
type OrderBookingRow = RowDataPacket & OrderBooking;
type StoredBookingRow = RowDataPacket & StoredBooking;

const BOOKING_COLUMNS = `bookings.id, bookings.order_id AS orderId, bookings.consultant_id AS consultantId, bookings.date,
  TIME_FORMAT(bookings.start_time, '%H:%i') AS startTime, TIME_FORMAT(bookings.end_time, '%H:%i') AS endTime,
  bookings.hours, bookings.description`;

async function isConsultantAssigned(db: Pool | PoolConnection, consultantId: string, orderId: string) {
  const [rows] = await db.query<RowDataPacket[]>(
    "SELECT 1 FROM order_assignments WHERE consultant_id = ? AND order_id = ?",
    [consultantId, orderId],
  );
  return rows.length > 0;
}

async function findOrder(db: Pool | PoolConnection, orderId: string, lock = "") {
  const [rows] = await db.query<OrderRow[]>(`SELECT id, ordered_person_days FROM orders WHERE id = ? ${lock}`, [orderId]);
  const row = rows[0];
  return row ? { id: row.id, orderedPersonDays: row.ordered_person_days } : null;
}

async function sumBookedHours(db: Pool | PoolConnection, orderId: string) {
  const [rows] = await db.query<TotalRow[]>("SELECT COALESCE(SUM(hours), 0) AS total FROM bookings WHERE order_id = ?", [
    orderId,
  ]);
  return rows[0]?.total ?? 0;
}

function createTransaction(connection: PoolConnection): BookingTransaction {
  return {
    findOrderForUpdate: (orderId) => findOrder(connection, orderId, "FOR UPDATE"),
    isConsultantAssigned: (consultantId, orderId) => isConsultantAssigned(connection, consultantId, orderId),
    sumBookedHours: (orderId) => sumBookedHours(connection, orderId),
    lockConsultant: async (consultantId) => {
      await connection.query("SELECT id FROM consultants WHERE id = ? FOR UPDATE", [consultantId]);
    },
    findBookingsOnDate: async (consultantId, date) => {
      const [rows] = await connection.query<DayBookingRow[]>(
        `SELECT TIME_FORMAT(start_time, '%H:%i') AS startTime, TIME_FORMAT(end_time, '%H:%i') AS endTime, hours
         FROM bookings WHERE consultant_id = ? AND date = ?`,
        [consultantId, date],
      );
      return rows.map(({ startTime, endTime, hours }) => ({ startTime, endTime, hours }));
    },
    saveBooking: async (booking) => {
      const [result] = await connection.query<ResultSetHeader>(
        `INSERT INTO bookings (order_id, consultant_id, date, start_time, end_time, hours, description)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          booking.orderId,
          booking.consultantId,
          booking.date,
          booking.startTime,
          booking.endTime,
          booking.hours,
          booking.description,
        ],
      );
      return { id: result.insertId, ...booking };
    },
  };
}

export function createMysqlBookingRepository(db: Pool): BookingRepository {
  return {
    listOrders: async () => {
      const [rows] = await db.query<OrderSummaryRow[]>("SELECT id, title FROM orders ORDER BY id");
      return rows.map(({ id, title }) => ({ id, title }));
    },
    listAssignedOrders: async (consultantId) => {
      const [rows] = await db.query<OrderSummaryRow[]>(
        `SELECT orders.id, orders.title FROM orders
         JOIN order_assignments ON order_assignments.order_id = orders.id
         WHERE order_assignments.consultant_id = ? ORDER BY orders.id`,
        [consultantId],
      );
      return rows.map(({ id, title }) => ({ id, title }));
    },
    listOrdersLedBy: async (userId) => {
      const [rows] = await db.query<OrderSummaryRow[]>("SELECT id, title FROM orders WHERE project_lead_id = ? ORDER BY id", [userId]);
      return rows.map(({ id, title }) => ({ id, title }));
    },
    isConsultantAssigned: (consultantId, orderId) => isConsultantAssigned(db, consultantId, orderId),
    isOrderLedBy: async (userId, orderId) => {
      const [rows] = await db.query<RowDataPacket[]>("SELECT 1 FROM orders WHERE id = ? AND project_lead_id = ?", [orderId, userId]);
      return rows.length > 0;
    },
    listRecentBookingsOfConsultant: async (consultantId) => {
      const [rows] = await db.query<StoredBookingRow[]>(
        `SELECT ${BOOKING_COLUMNS} FROM bookings WHERE bookings.consultant_id = ?
         ORDER BY bookings.date DESC, bookings.start_time DESC LIMIT ?`,
        [consultantId, RECENT_BOOKINGS_LIMIT],
      );
      return rows.map((row) => ({ ...row }));
    },
    listRecentBookingsOfOrder: async (orderId) => {
      const [rows] = await db.query<OrderBookingRow[]>(
        `SELECT ${BOOKING_COLUMNS}, consultants.name AS consultantName FROM bookings
         JOIN consultants ON consultants.id = bookings.consultant_id
         WHERE bookings.order_id = ?
         ORDER BY bookings.date DESC, bookings.start_time DESC LIMIT ?`,
        [orderId, RECENT_BOOKINGS_LIMIT],
      );
      return rows.map((row) => ({ ...row }));
    },
    findOrder: (orderId) => findOrder(db, orderId),
    sumBookedHours: (orderId) => sumBookedHours(db, orderId),

    async transaction(work) {
      const connection = await db.getConnection();
      try {
        await connection.beginTransaction();
        const result = await work(createTransaction(connection));
        await connection.commit();
        return result;
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    },
  };
}
