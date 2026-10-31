# 0006 · MySQL database

- **Status:** accepted, replaces the database choice in [ADR-0001](0001-technology-stack.md)
- **Date:** 2026-10-31
- **Deciders:** Team lastWorche

## Context

ADR-0001 chose SQLite because it needs no server. The team has since decided on a database server. The core data is strongly related: orders have bookings, consultants are assigned to orders, and proofs of work summarise bookings. Budget rules must hold when several consultants book on the same order at the same moment. The jury still has to start the product from the README within 5 minutes.

## Options considered

1. **MySQL** – foreign keys and transactions fit related data and budget checks; a separate server that runs in a container / the jury needs Docker, and schema changes need care.
2. **MongoDB** – flexible documents / relations and foreign keys must be handled in code, which suits this data poorly, and the schema is less visible to the jury.
3. **Stay on SQLite** – no server, the simplest start / one writer at a time on one machine, so it does not fit the production plan in [ADR-0003](0003-operation-and-scaling.md).

## Decision

We choose **MySQL 8.4**, accessed with `mysql2`, and started by [compose.yaml](../../compose.yaml). A booking's budget check and insert share one transaction that locks the order (`SELECT … FOR UPDATE`), so simultaneous bookings cannot overspend together.

## Consequences

- The jury needs Docker, and the first start downloads the MySQL image. The README lists this.
- The Compose file starts only the database, so it counts only partly towards the containers building block. The backend and client still start from the README.
- Tables are created at startup with `CREATE TABLE IF NOT EXISTS`. There is no migration tool, so changing an existing table needs a manual step or a new database.
- Unit tests use an in-memory repository and need no database. Tests against real MySQL run only when `TEST_DATABASE_URL` is set, and they delete the bookings in that database.
