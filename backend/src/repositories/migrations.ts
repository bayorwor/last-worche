// Every change to the database, in order. Each one runs once, and schema_migrations records which
// have run. Never edit one that has been committed: add a new one at the end. See ADR-0010.
import type { Pool } from "mysql2/promise";
import {
  ACCOUNTING_OBJECTS,
  ASSIGNMENTS,
  buildDemoBookings,
  CONSULTANTS,
  DEMO_PROJECT_LEAD_ID,
  DEMO_USERS,
  CONSULTANT_STATES,
  ORDER_PERIODS,
  ORDER_SUPPLIERS,
  VACATIONS,
  ORDERS,
  ROLES,
  SECOND_LEAD_ORDER,
  SECOND_LEAD_ORDER_CONSULTANT_ID,
  SECOND_LEAD_ORDER_DAYS,
  SHUTDOWNS,
  SUPPLIERS,
  TEST_PASSWORD,
  TEST_USERS,
} from "./seedData.ts";

type Migration = {
  name: string;
  run: (db: Pool) => Promise<void>;
};

export const MIGRATIONS: Migration[] = [
  {
    // IF NOT EXISTS, because databases from before this file already have these two tables.
    name: "001-orders-and-bookings",
    async run(db) {
      await db.query(`
        CREATE TABLE IF NOT EXISTS orders (
          id VARCHAR(32) PRIMARY KEY,
          ordered_person_days DECIMAL(8, 3) NOT NULL
        )
      `);
      await db.query(`
        CREATE TABLE IF NOT EXISTS bookings (
          id INT AUTO_INCREMENT PRIMARY KEY,
          order_id VARCHAR(32) NOT NULL,
          consultant_id VARCHAR(64) NOT NULL,
          date DATE NOT NULL,
          hours DECIMAL(6, 2) NOT NULL,
          description TEXT NOT NULL,
          FOREIGN KEY (order_id) REFERENCES orders(id)
        )
      `);
    },
  },
  {
    name: "002-people-and-assignments",
    async run(db) {
      await db.query(`
        CREATE TABLE accounting_objects (
          id VARCHAR(32) PRIMARY KEY,
          name VARCHAR(255) NOT NULL
        )
      `);
      await db.query(`
        CREATE TABLE suppliers (
          id VARCHAR(64) PRIMARY KEY,
          name VARCHAR(255) NOT NULL
        )
      `);
      await db.query(`
        CREATE TABLE consultants (
          id VARCHAR(64) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          supplier_id VARCHAR(64) NOT NULL,
          FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
        )
      `);
      await db.query(`
        CREATE TABLE order_assignments (
          consultant_id VARCHAR(64) NOT NULL,
          order_id VARCHAR(32) NOT NULL,
          PRIMARY KEY (consultant_id, order_id),
          FOREIGN KEY (consultant_id) REFERENCES consultants(id),
          FOREIGN KEY (order_id) REFERENCES orders(id)
        )
      `);
      await db.query(`
        CREATE TABLE users (
          id VARCHAR(64) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          role ENUM('consultant', 'project_lead', 'purchasing') NOT NULL,
          consultant_id VARCHAR(64) NULL,
          FOREIGN KEY (consultant_id) REFERENCES consultants(id)
        )
      `);
      await db.query("ALTER TABLE orders ADD COLUMN title VARCHAR(255) NOT NULL DEFAULT '', ADD COLUMN accounting_object_id VARCHAR(32) NULL");

      await db.query("INSERT INTO accounting_objects (id, name) VALUES ?", [ACCOUNTING_OBJECTS.map((a) => [a.id, a.name])]);
      await db.query("INSERT INTO suppliers (id, name) VALUES ?", [SUPPLIERS.map((s) => [s.id, s.name])]);
      await db.query("INSERT INTO consultants (id, name, supplier_id) VALUES ?", [CONSULTANTS.map((c) => [c.id, c.name, c.supplierId])]);
      await db.query("INSERT IGNORE INTO orders (id, ordered_person_days) VALUES ?", [ORDERS.map((o) => [o.id, o.orderedPersonDays])]);
      for (const order of ORDERS) {
        await db.query("UPDATE orders SET title = ?, accounting_object_id = ? WHERE id = ?", [order.title, order.accountingObjectId, order.id]);
      }
      await db.query("INSERT INTO order_assignments (consultant_id, order_id) VALUES ?", [ASSIGNMENTS.map((a) => [a.consultantId, a.orderId])]);
      await db.query("INSERT INTO users (id, name, role, consultant_id) VALUES ?", [DEMO_USERS.map((u) => [u.id, u.name, u.role, u.consultantId])]);

      // Only now, because the rows these rules check had to exist first.
      await db.query(`
        ALTER TABLE orders
          MODIFY accounting_object_id VARCHAR(32) NOT NULL,
          ADD FOREIGN KEY (accounting_object_id) REFERENCES accounting_objects(id)
      `);
      await db.query("ALTER TABLE bookings ADD FOREIGN KEY (consultant_id) REFERENCES consultants(id)");
    },
  },
  {
    name: "003-demo-bookings",
    async run(db) {
      await db.query("INSERT INTO bookings (order_id, consultant_id, date, hours, description) VALUES ?", [
        buildDemoBookings().map((b) => [b.orderId, b.consultantId, b.date, b.hours, b.description]),
      ]);
    },
  },
  {
    // Overlaps and rest periods need clock times. Existing bookings get a start of 09:00.
    name: "004-booking-times",
    async run(db) {
      await db.query("ALTER TABLE bookings ADD COLUMN start_time TIME NULL, ADD COLUMN end_time TIME NULL");
      await db.query("UPDATE bookings SET start_time = '09:00:00', end_time = ADDTIME('09:00:00', SEC_TO_TIME(hours * 3600))");
      await db.query("ALTER TABLE bookings MODIFY start_time TIME NOT NULL, MODIFY end_time TIME NOT NULL");
    },
  },
  {
    // A project lead may only see the orders they lead.
    name: "005-order-project-lead",
    async run(db) {
      await db.query("ALTER TABLE orders ADD COLUMN project_lead_id VARCHAR(64) NULL");
      await db.query("UPDATE orders SET project_lead_id = ?", [DEMO_PROJECT_LEAD_ID]);
      await db.query(`
        ALTER TABLE orders
          MODIFY project_lead_id VARCHAR(64) NOT NULL,
          ADD FOREIGN KEY (project_lead_id) REFERENCES users(id)
      `);
    },
  },
  {
    // Sign-in with email and password, roles as data, and enough test users to see each role's data (ADR-0013).
    name: "006-roles-and-accounts",
    async run(db) {
      await db.query(`
        CREATE TABLE roles (
          id VARCHAR(32) PRIMARY KEY,
          name_de VARCHAR(255) NOT NULL,
          name_en VARCHAR(255) NOT NULL,
          summary_de VARCHAR(255) NOT NULL,
          summary_en VARCHAR(255) NOT NULL,
          sort_order INT NOT NULL
        )
      `);
      await db.query("INSERT INTO roles (id, name_de, name_en, summary_de, summary_en, sort_order) VALUES ?", [
        ROLES.map((role, position) => [role.id, role.nameDe, role.nameEn, role.summaryDe, role.summaryEn, position]),
      ]);

      await db.query(`
        ALTER TABLE users
          MODIFY role VARCHAR(32) NOT NULL,
          ADD FOREIGN KEY (role) REFERENCES roles(id),
          ADD COLUMN email VARCHAR(255) NULL,
          ADD COLUMN password_hash VARCHAR(255) NULL
      `);

      const passwordHash = await Bun.password.hash(TEST_PASSWORD);
      await db.query("INSERT IGNORE INTO users (id, name, role, consultant_id) VALUES ?", [
        TEST_USERS.map((user) => [user.id, user.name, user.role, user.consultantId]),
      ]);
      for (const user of TEST_USERS) {
        await db.query("UPDATE users SET email = ?, password_hash = ? WHERE id = ?", [user.email, passwordHash, user.id]);
      }
      await db.query(`
        ALTER TABLE users
          MODIFY email VARCHAR(255) NOT NULL UNIQUE,
          MODIFY password_hash VARCHAR(255) NOT NULL
      `);

      const order = SECOND_LEAD_ORDER;
      await db.query(
        "INSERT INTO orders (id, title, ordered_person_days, accounting_object_id, project_lead_id) VALUES (?, ?, ?, ?, ?)",
        [order.id, order.title, order.orderedPersonDays, order.accountingObjectId, order.projectLeadId],
      );
      await db.query("INSERT INTO order_assignments (consultant_id, order_id) VALUES (?, ?)", [
        SECOND_LEAD_ORDER_CONSULTANT_ID,
        order.id,
      ]);
      await db.query("INSERT INTO bookings (order_id, consultant_id, date, start_time, end_time, hours, description) VALUES ?", [
        SECOND_LEAD_ORDER_DAYS.map((date) => [order.id, SECOND_LEAD_ORDER_CONSULTANT_ID, date, "09:00", "17:00", 8, "Portal rollout planning"]),
      ]);
    },
  },
  {
    // Sign-in with a code by email instead of a password (ADR-0014).
    name: "007-sign-in-codes",
    async run(db) {
      await db.query(`
        CREATE TABLE sign_in_codes (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id VARCHAR(64) NOT NULL UNIQUE,
          code_hash CHAR(64) NOT NULL,
          created_at_ms BIGINT NOT NULL,
          expires_at_ms BIGINT NOT NULL,
          attempts INT NOT NULL DEFAULT 0,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);
      await db.query("ALTER TABLE users DROP COLUMN password_hash");
    },
  },
  {
    // An order is given to one supplier, which purchasing needs for its totals per supplier (story #13).
    name: "008-order-supplier",
    async run(db) {
      await db.query("ALTER TABLE orders ADD COLUMN supplier_id VARCHAR(64) NULL");
      for (const { orderId, supplierId } of ORDER_SUPPLIERS) {
        await db.query("UPDATE orders SET supplier_id = ? WHERE id = ?", [supplierId, orderId]);
      }
      await db.query(`
        ALTER TABLE orders
          MODIFY supplier_id VARCHAR(64) NOT NULL,
          ADD FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
      `);
    },
  },
  {
    // One row means that month of that order is approved. Its totals are always added up from the bookings (story #11).
    name: "009-proofs-of-work",
    async run(db) {
      await db.query(`
        CREATE TABLE proofs_of_work (
          order_id VARCHAR(32) NOT NULL,
          month CHAR(7) NOT NULL,
          approved_by_user_id VARCHAR(64) NOT NULL,
          approved_at_ms BIGINT NOT NULL,
          PRIMARY KEY (order_id, month),
          FOREIGN KEY (order_id) REFERENCES orders(id),
          FOREIGN KEY (approved_by_user_id) REFERENCES users(id)
        )
      `);
    },
  },
  {
    // What happened, for the recent activity panel. Earlier bookings and approvals are copied in, so the panel starts with real data.
    name: "010-activity-log",
    async run(db) {
      await db.query(`
        CREATE TABLE activity_log (
          id INT AUTO_INCREMENT PRIMARY KEY,
          type ENUM('signed_in', 'profile_updated', 'booking_created', 'proof_approved') NOT NULL,
          actor_user_id VARCHAR(64) NOT NULL,
          occurred_at_ms BIGINT NOT NULL,
          order_id VARCHAR(32) NULL,
          period VARCHAR(10) NULL,
          hours DECIMAL(6, 2) NULL,
          INDEX activity_log_newest_first (occurred_at_ms),
          FOREIGN KEY (actor_user_id) REFERENCES users(id),
          FOREIGN KEY (order_id) REFERENCES orders(id)
        )
      `);
      await db.query(`
        INSERT INTO activity_log (type, actor_user_id, occurred_at_ms, order_id, period, hours)
        SELECT 'booking_created', users.id, UNIX_TIMESTAMP(TIMESTAMP(bookings.date, bookings.end_time)) * 1000,
          bookings.order_id, DATE_FORMAT(bookings.date, '%Y-%m-%d'), bookings.hours
        FROM bookings
        JOIN users ON users.consultant_id = bookings.consultant_id
      `);
      await db.query(`
        INSERT INTO activity_log (type, actor_user_id, occurred_at_ms, order_id, period)
        SELECT 'proof_approved', approved_by_user_id, approved_at_ms, order_id, month
        FROM proofs_of_work
      `);
    },
  },
  {
    // What the order period, vacation and public holiday rules check (stories #8 and #12).
    name: "011-order-periods-and-calendars",
    async run(db) {
      await db.query(`
        ALTER TABLE orders
          ADD COLUMN start_date DATE NULL,
          ADD COLUMN end_date DATE NULL,
          ADD COLUMN project_end_date DATE NULL
      `);
      for (const { orderId, startDate, endDate, projectEndDate } of ORDER_PERIODS) {
        await db.query("UPDATE orders SET start_date = ?, end_date = ?, project_end_date = ? WHERE id = ?", [
          startDate,
          endDate,
          projectEndDate,
          orderId,
        ]);
      }
      await db.query(`
        ALTER TABLE orders
          MODIFY start_date DATE NOT NULL,
          MODIFY end_date DATE NOT NULL,
          MODIFY project_end_date DATE NOT NULL
      `);

      await db.query("ALTER TABLE consultants ADD COLUMN federal_state CHAR(2) NULL");
      for (const { consultantId, federalState } of CONSULTANT_STATES) {
        await db.query("UPDATE consultants SET federal_state = ? WHERE id = ?", [federalState, consultantId]);
      }

      await db.query(`
        CREATE TABLE vacations (
          id INT AUTO_INCREMENT PRIMARY KEY,
          consultant_id VARCHAR(64) NOT NULL,
          start_date DATE NOT NULL,
          end_date DATE NOT NULL,
          FOREIGN KEY (consultant_id) REFERENCES consultants(id)
        )
      `);
      await db.query("INSERT INTO vacations (consultant_id, start_date, end_date) VALUES ?", [
        VACATIONS.map(({ consultantId, startDate, endDate }) => [consultantId, startDate, endDate]),
      ]);
    },
  },
  {
    // Company holidays for the forecast, and follow-up requests from a project lead to purchasing (stories #10, #14).
    name: "012-shutdowns-and-follow-ups",
    async run(db) {
      await db.query(`
        CREATE TABLE shutdowns (
          id INT AUTO_INCREMENT PRIMARY KEY,
          start_date DATE NOT NULL,
          end_date DATE NOT NULL
        )
      `);
      await db.query("INSERT INTO shutdowns (start_date, end_date) VALUES ?", [SHUTDOWNS.map(({ startDate, endDate }) => [startDate, endDate])]);

      await db.query(`
        CREATE TABLE follow_up_requests (
          id INT AUTO_INCREMENT PRIMARY KEY,
          order_id VARCHAR(32) NOT NULL,
          requested_by_user_id VARCHAR(64) NOT NULL,
          person_days DECIMAL(8, 3) NOT NULL,
          needed_by_date DATE NOT NULL,
          status ENUM('open', 'confirmed') NOT NULL DEFAULT 'open',
          requested_at_ms BIGINT NOT NULL,
          confirmed_by_user_id VARCHAR(64) NULL,
          confirmed_at_ms BIGINT NULL,
          FOREIGN KEY (order_id) REFERENCES orders(id),
          FOREIGN KEY (requested_by_user_id) REFERENCES users(id),
          FOREIGN KEY (confirmed_by_user_id) REFERENCES users(id)
        )
      `);
      await db.query(`
        ALTER TABLE activity_log MODIFY type
          ENUM('signed_in', 'profile_updated', 'booking_created', 'proof_approved', 'follow_up_requested', 'follow_up_confirmed') NOT NULL
      `);
    },
  },
];
