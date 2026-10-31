# 0011 · MySQL without Docker

- **Status:** accepted, replaces the use of Docker Compose in [ADR-0006](0006-mysql-database.md)
- **Date:** 2026-10-31
- **Deciders:** Team lastWorche

## Context

ADR-0006 started MySQL with a Compose file. The team has decided not to use Docker. The jury still has to start the product from the README within 5 minutes, and MySQL remains the database.

## Options considered

1. **MySQL installed on the machine** – no Docker, and a single setup command creates the database / everyone must install MySQL first, and versions can differ between machines.
2. **Keep Docker Compose** – the same MySQL version everywhere, and it counts towards building block E / the team does not want to use Docker.
3. **Go back to SQLite** – nothing to install / undoes ADR-0006 and its handling of simultaneous bookings.

## Decision

We choose **MySQL installed on the machine**. `backend/setup-database.sql` creates the database and user that `backend/.env.example` expects. The backend then adds the tables and sample data on start.

## Consequences

- MySQL becomes a prerequisite that the jury must have installed and running. The README lists it.
- Setup needs the MySQL root password of that machine.
- We deliver no containers, so building block E of the technical score counts as not delivered.
- Versions can differ between machines. We name MySQL 8.4 or newer in the README, and the team should test on 8.4.
