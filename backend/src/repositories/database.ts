// Connects to MySQL and creates the tables and sample data on first start.
import mysql, { type Pool } from "mysql2/promise";

export const SEED_ORDER_ID = "4500012345";

export async function openDatabase(url: string): Promise<Pool> {
  const db = mysql.createPool({
    uri: url,
    decimalNumbers: true, // return DECIMAL columns as numbers
    dateStrings: true, // return DATE columns as YYYY-MM-DD, with no time zone shift
  });

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
  await db.query("INSERT IGNORE INTO orders (id, ordered_person_days) VALUES (?, ?)", [SEED_ORDER_ID, 140]);
  return db;
}
