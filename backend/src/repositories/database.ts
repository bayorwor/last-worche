// Connects to MySQL and brings the database up to date, including the sample data on first start.
import mysql, { type Pool, type RowDataPacket } from "mysql2/promise";
import { MIGRATIONS } from "./migrations.ts";

type MigrationRow = RowDataPacket & { name: string };

export async function openDatabase(url: string): Promise<Pool> {
  const db = mysql.createPool({
    uri: url,
    decimalNumbers: true, // return DECIMAL columns as numbers
    dateStrings: true, // return DATE columns as YYYY-MM-DD, with no time zone shift
  });

  await runMigrations(db);
  return db;
}

async function runMigrations(db: Pool) {
  await db.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name VARCHAR(64) PRIMARY KEY,
      applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const [rows] = await db.query<MigrationRow[]>("SELECT name FROM schema_migrations");
  const appliedNames = new Set(rows.map((row) => row.name));

  for (const migration of MIGRATIONS) {
    if (!appliedNames.has(migration.name)) {
      await migration.run(db);
      await db.query("INSERT INTO schema_migrations (name) VALUES (?)", [migration.name]);
      console.log(`Applied database migration ${migration.name}`);
    }
  }
}
