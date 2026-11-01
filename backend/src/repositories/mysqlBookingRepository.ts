// MySQL implementation of BookingRepository. Database column names stay inside this file.
import type { Pool, PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import type { ConsultantCalendar, DateRange, DayBooking } from "../domain/booking.ts";
import type { BookedDay } from "../domain/forecast.ts";
import type { FollowUpRequest } from "../domain/followUp.ts";
import type { ProofOfWorkTotals } from "../domain/proofOfWork.ts";
import type { OrderTotals } from "../domain/purchasing.ts";
import {
  RECENT_BOOKINGS_LIMIT,
  type BookingRepository,
  type BookingTransaction,
  type OrderBooking,
  type OrderSummary,
  type StoredBooking,
} from "./bookingRepository.ts";
import { insertActivity } from "./mysqlActivityRepository.ts";

type OrderRow = RowDataPacket & { id: string; ordered_person_days: number; startDate: string; endDate: string };
type ConsultantStateRow = RowDataPacket & { federal_state: ConsultantCalendar["federalState"] };
type DateRangeRow = RowDataPacket & DateRange;
type TotalRow = RowDataPacket & { total: number };
type OrderSummaryRow = RowDataPacket & OrderSummary;
type DayBookingRow = RowDataPacket & DayBooking;
type OrderBookingRow = RowDataPacket & OrderBooking;
type StoredBookingRow = RowDataPacket & StoredBooking;
type OrderTotalsRow = RowDataPacket & OrderTotals;
type ProofOfWorkRow = RowDataPacket & ProofOfWorkTotals;
type CountRow = RowDataPacket & { total: number };
type BookedDayRow = RowDataPacket & BookedDay;
type SupplierIdRow = RowDataPacket & { supplier_id: string };
type FollowUpRow = RowDataPacket & FollowUpRequest;
type ConsultantCalendarRow = RowDataPacket & { id: string; federal_state: ConsultantCalendar["federalState"] };
type ConsultantVacationRow = RowDataPacket & DateRange & { consultant_id: string };
type ProjectEndRow = RowDataPacket & { projectEndDate: string };
type FollowUpLockRow = RowDataPacket & { orderId: string; personDays: number; status: FollowUpRequest["status"] };

const FOLLOW_UP_COLUMNS = `follow_up_requests.id, follow_up_requests.order_id AS orderId, orders.title AS orderTitle,
  follow_up_requests.person_days AS personDays, follow_up_requests.needed_by_date AS neededByDate,
  follow_up_requests.status, follow_up_requests.requested_at_ms AS requestedAtMs`;

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
  const [rows] = await db.query<OrderRow[]>(`SELECT id, ordered_person_days, start_date AS startDate, end_date AS endDate FROM orders WHERE id = ? ${lock}`,
    [orderId],
  );
  const row = rows[0];
  return row ? { id: row.id, orderedPersonDays: row.ordered_person_days, startDate: row.startDate, endDate: row.endDate } : null;
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
    findConsultantCalendar: async (consultantId) => {
      const [consultants] = await connection.query<ConsultantStateRow[]>("SELECT federal_state FROM consultants WHERE id = ?", [consultantId]);
      const [vacations] = await connection.query<DateRangeRow[]>(
        "SELECT start_date AS startDate, end_date AS endDate FROM vacations WHERE consultant_id = ?",
        [consultantId],
      );
      return {
        federalState: consultants[0]?.federal_state ?? null,
        vacations: vacations.map(({ startDate, endDate }) => ({ startDate, endDate })),
      };
    },
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
    isMonthApproved: async (orderId, month) => {
      const [rows] = await connection.query<RowDataPacket[]>("SELECT 1 FROM proofs_of_work WHERE order_id = ? AND month = ?", [
        orderId,
        month,
      ]);
      return rows.length > 0;
    },
    countBookingsInMonth: async (orderId, month) => {
      const [rows] = await connection.query<CountRow[]>(
        "SELECT COUNT(*) AS total FROM bookings WHERE order_id = ? AND DATE_FORMAT(date, '%Y-%m') = ?",
        [orderId, month],
      );
      return rows[0]?.total ?? 0;
    },
    approveMonth: async ({ orderId, month, approvedByUserId, approvedAtMs }) => {
      await connection.query(
        "INSERT INTO proofs_of_work (order_id, month, approved_by_user_id, approved_at_ms) VALUES (?, ?, ?, ?)",
        [orderId, month, approvedByUserId, approvedAtMs],
      );
    },
    recordActivity: (activity) => insertActivity(connection, activity),
    findConsultantSupplierId: async (consultantId) => {
      const [rows] = await connection.query<SupplierIdRow[]>("SELECT supplier_id FROM consultants WHERE id = ?", [consultantId]);
      return rows[0]?.supplier_id ?? null;
    },
    findOrderSupplierId: async (orderId) => {
      const [rows] = await connection.query<SupplierIdRow[]>("SELECT supplier_id FROM orders WHERE id = ?", [orderId]);
      return rows[0]?.supplier_id ?? null;
    },
    hasSameBooking: async ({ consultantId, date, orderId, hours }) => {
      const [rows] = await connection.query<RowDataPacket[]>(
        "SELECT 1 FROM bookings WHERE consultant_id = ? AND date = ? AND order_id = ? AND hours = ?",
        [consultantId, date, orderId, hours],
      );
      return rows.length > 0;
    },
    hasOpenFollowUp: async (orderId) => {
      const [rows] = await connection.query<RowDataPacket[]>("SELECT 1 FROM follow_up_requests WHERE order_id = ? AND status = 'open'", [orderId]);
      return rows.length > 0;
    },
    saveFollowUp: async ({ orderId, requestedByUserId, personDays, neededByDate, requestedAtMs }) => {
      const [result] = await connection.query<ResultSetHeader>(
        "INSERT INTO follow_up_requests (order_id, requested_by_user_id, person_days, needed_by_date, requested_at_ms) VALUES (?, ?, ?, ?, ?)",
        [orderId, requestedByUserId, personDays, neededByDate, requestedAtMs],
      );
      return result.insertId;
    },
    findFollowUpForUpdate: async (id) => {
      const [rows] = await connection.query<FollowUpLockRow[]>(
        "SELECT order_id AS orderId, person_days AS personDays, status FROM follow_up_requests WHERE id = ? FOR UPDATE",
        [id],
      );
      const row = rows[0];
      return row ? { orderId: row.orderId, personDays: row.personDays, status: row.status } : null;
    },
    confirmFollowUp: async (id, confirmedByUserId, confirmedAtMs) => {
      await connection.query(
        `UPDATE follow_up_requests
         JOIN orders ON orders.id = follow_up_requests.order_id
         SET follow_up_requests.status = 'confirmed', follow_up_requests.confirmed_by_user_id = ?, follow_up_requests.confirmed_at_ms = ?,
           orders.ordered_person_days = orders.ordered_person_days + follow_up_requests.person_days,
           orders.end_date = GREATEST(orders.end_date, orders.project_end_date)
         WHERE follow_up_requests.id = ?`,
        [confirmedByUserId, confirmedAtMs, id],
      );
    },
    recordBookingCreated: async ({ consultantId, orderId, date, hours }, occurredAtMs) => {
      await connection.query(
        `INSERT INTO activity_log (type, actor_user_id, occurred_at_ms, order_id, period, hours)
         SELECT 'booking_created', id, ?, ?, ?, ? FROM users WHERE consultant_id = ?`,
        [occurredAtMs, orderId, date, hours, consultantId],
      );
    },
  };
}

export function createMysqlBookingRepository(db: Pool): BookingRepository {
  return {
    listOrders: async () => {
      const [rows] = await db.query<OrderSummaryRow[]>("SELECT id, title FROM orders ORDER BY id");
      return rows.map(({ id, title }) => ({ id, title }));
    },
    listOrderTotals: async () => {
      const [rows] = await db.query<OrderTotalsRow[]>(
        `SELECT orders.id AS orderId, orders.title, orders.ordered_person_days AS orderedPersonDays,
           suppliers.id AS supplierId, suppliers.name AS supplierName, COALESCE(SUM(bookings.hours), 0) AS bookedHours
         FROM orders
         JOIN suppliers ON suppliers.id = orders.supplier_id
         LEFT JOIN bookings ON bookings.order_id = orders.id
         GROUP BY orders.id, orders.title, orders.ordered_person_days, suppliers.id, suppliers.name
         ORDER BY suppliers.name, orders.id`,
      );
      return rows.map((row) => ({ ...row }));
    },
    listProofsOfWork: async (orderId) => {
      const [rows] = await db.query<ProofOfWorkRow[]>(
        `SELECT months.month, months.bookedHours, months.bookingCount, months.consultantCount,
           proofs_of_work.approved_at_ms AS approvedAtMs, users.name AS approvedByName
         FROM (
           SELECT DATE_FORMAT(date, '%Y-%m') AS month, SUM(hours) AS bookedHours, COUNT(*) AS bookingCount,
             COUNT(DISTINCT consultant_id) AS consultantCount
           FROM bookings WHERE order_id = ? GROUP BY DATE_FORMAT(date, '%Y-%m')
         ) AS months
         LEFT JOIN proofs_of_work ON proofs_of_work.order_id = ? AND proofs_of_work.month = months.month
         LEFT JOIN users ON users.id = proofs_of_work.approved_by_user_id
         ORDER BY months.month DESC`,
        [orderId, orderId],
      );
      return rows.map((row) => ({ ...row }));
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
    listBookingsOfMonth: async (orderId, month) => {
      const [rows] = await db.query<OrderBookingRow[]>(
        `SELECT ${BOOKING_COLUMNS}, consultants.name AS consultantName FROM bookings
         JOIN consultants ON consultants.id = bookings.consultant_id
         WHERE bookings.order_id = ? AND DATE_FORMAT(bookings.date, '%Y-%m') = ?
         ORDER BY bookings.date, bookings.start_time`,
        [orderId, month],
      );
      return rows.map((row) => ({ ...row }));
    },
    ping: async () => {
      await db.query("SELECT 1");
    },
    findOrder: (orderId) => findOrder(db, orderId),
    findProjectEndDate: async (orderId) => {
      const [rows] = await db.query<ProjectEndRow[]>("SELECT project_end_date AS projectEndDate FROM orders WHERE id = ?", [orderId]);
      return rows[0]?.projectEndDate ?? null;
    },
    listBookedDays: async (orderId) => {
      const [rows] = await db.query<BookedDayRow[]>(
        "SELECT consultant_id AS consultantId, date, SUM(hours) AS hours FROM bookings WHERE order_id = ? GROUP BY consultant_id, date",
        [orderId],
      );
      return rows.map(({ consultantId, date, hours }) => ({ consultantId, date, hours: Number(hours) }));
    },
    findConsultantCalendars: async (consultantIds) => {
      if (consultantIds.length === 0) return {};
      const [consultants] = await db.query<ConsultantCalendarRow[]>("SELECT id, federal_state FROM consultants WHERE id IN (?)", [consultantIds]);
      const [vacations] = await db.query<ConsultantVacationRow[]>(
        "SELECT consultant_id, start_date AS startDate, end_date AS endDate FROM vacations WHERE consultant_id IN (?)",
        [consultantIds],
      );
      return Object.fromEntries(
        consultants.map(({ id, federal_state }) => [
          id,
          {
            federalState: federal_state,
            vacations: vacations.filter((vacation) => vacation.consultant_id === id).map(({ startDate, endDate }) => ({ startDate, endDate })),
          },
        ]),
      );
    },
    listShutdowns: async () => {
      const [rows] = await db.query<DateRangeRow[]>("SELECT start_date AS startDate, end_date AS endDate FROM shutdowns");
      return rows.map(({ startDate, endDate }) => ({ startDate, endDate }));
    },
    listFollowUps: async () => {
      const [rows] = await db.query<FollowUpRow[]>(
        `SELECT ${FOLLOW_UP_COLUMNS} FROM follow_up_requests JOIN orders ON orders.id = follow_up_requests.order_id
         ORDER BY follow_up_requests.status = 'open' DESC, follow_up_requests.requested_at_ms DESC`,
      );
      return rows.map((row) => ({ ...row }));
    },
    findOpenFollowUpOfOrder: async (orderId) => {
      const [rows] = await db.query<FollowUpRow[]>(
        `SELECT ${FOLLOW_UP_COLUMNS} FROM follow_up_requests JOIN orders ON orders.id = follow_up_requests.order_id
         WHERE follow_up_requests.order_id = ? AND follow_up_requests.status = 'open'`,
        [orderId],
      );
      return rows[0] ? { ...rows[0] } : null;
    },
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
