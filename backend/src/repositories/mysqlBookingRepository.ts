// MySQL implementation of BookingRepository. Database column names stay inside this file.
import type { Pool, PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import type { DayBooking } from "../domain/booking.ts";
import type { BookingRepository, BookingTransaction, OrderSummary } from "./bookingRepository.ts";

type OrderRow = RowDataPacket & { id: string; ordered_person_days: number };
type TotalRow = RowDataPacket & { total: number };
type OrderSummaryRow = RowDataPacket & OrderSummary;
type DayBookingRow = RowDataPacket & DayBooking;

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
    isConsultantAssigned: async (consultantId, orderId) => {
      const [rows] = await connection.query<RowDataPacket[]>(
        "SELECT 1 FROM order_assignments WHERE consultant_id = ? AND order_id = ?",
        [consultantId, orderId],
      );
      return rows.length > 0;
    },
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
