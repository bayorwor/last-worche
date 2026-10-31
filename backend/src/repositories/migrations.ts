// Every change to the database, in order. Each one runs once, and schema_migrations records which
// have run. Never edit one that has been committed: add a new one at the end. See ADR-0010.
import type { Pool } from "mysql2/promise";
import {
  ACCOUNTING_OBJECTS,
  ASSIGNMENTS,
  buildDemoBookings,
  CONSULTANTS,
  DEMO_USERS,
  ORDERS,
  SUPPLIERS,
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
];
