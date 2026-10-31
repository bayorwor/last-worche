# 0010 · Simple database migrations

- **Status:** proposed, replaces the "no migration tool" consequence in [ADR-0006](0006-mysql-database.md)
- **Date:** 2026-10-31
- **Deciders:** Team lastWorche

## Context

ADR-0006 created tables at startup with `CREATE TABLE IF NOT EXISTS`, which cannot change a table that already exists. Adding consultants and assignments changes `orders` and `bookings`, so every teammate's running database would break. Task #21 also asks for migrations.

## Options considered

1. **Our own small list of migrations** – about 20 lines, no new package, and easy to explain to the jury / no rollback, and a migration that fails halfway may need a new database.
2. **A migration tool or ORM, such as Knex or Drizzle** – rollback and tooling included / a new dependency and new concepts, for a schema that fits in one file.
3. **Keep the old way and delete the database on each change** – no code / loses data and fails task #21.

## Decision

We choose **our own list** in `backend/src/repositories/migrations.ts`. At startup, `openDatabase` runs each migration that the `schema_migrations` table does not list yet, then records it. Sample data is added by migrations as well, so it is created once and never overwrites later changes.

## Consequences

- A migration that has been committed must never be edited. Each change is a new migration at the end of the list.
- MySQL cannot undo table changes in a transaction, so a migration that fails halfway may leave the database partly changed. In development, `docker compose down -v` starts again from a clean database.
- A database from before this decision fails to upgrade if it has bookings for consultants who are not in the sample data. It needs the same reset.
- Migrations assume one backend starts at a time. Running several instances, as in [ADR-0003](0003-operation-and-scaling.md), needs a lock or a separate migration step.
