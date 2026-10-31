// MySQL implementation of BookingRepository. Database column names stay inside this file.
import type { Pool, PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import type { BookingRepository, BookingTransaction } from "./bookingRepository.ts";

type OrderRow = RowDataPacket & { id: string; ordered_person_days: number };
type TotalRow = RowDataPacket & { total: number };

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
    sumBookedHours: (orderId) => sumBookedHours(connection, orderId),
    saveBooking: async (booking) => {
      const [result] = await connection.query<ResultSetHeader>(
        "INSERT INTO bookings (order_id, consultant_id, date, hours, description) VALUES (?, ?, ?, ?, ?)",
        [booking.orderId, booking.consultantId, booking.date, booking.hours, booking.description],
      );
      return { id: result.insertId, ...booking };
    },
  };
}

export function createMysqlBookingRepository(db: Pool): BookingRepository {
  return {
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
