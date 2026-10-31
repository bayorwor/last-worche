# 0001 · Technology stack

- **Status:** accepted, database choice replaced by [0006](0006-mysql-database.md)
- **Date:** 2026-10-31
- **Deciders:** Team lastWorche

## Context

The sprint plan sets three constraints: one language, SQLite for persistence, and everything runnable from the README in under 5 minutes. The jury starts the product from a fresh clone, without paid accounts. Business rules must run on the server and have unit tests that run with one command.

## Options considered

1. **TypeScript with Bun, Express, SQLite and a React/Vite client** – one language; Bun includes a test runner and SQLite driver, so there is little to install; Express has plenty of documentation for its middleware model / two processes to start; no API documentation or database migrations out of the box.
2. **Next.js with PostgreSQL** (the template's `blueprint` branch) – UI and API in one project, a known example / needs a database server or Docker, which makes the 5-minute start harder and goes against the SQLite constraint.
3. **Python with FastAPI, SQLite and a React client** – very little code, generates API documentation / two languages once the client is in React, which goes against the one-language constraint.

## Decision

We choose **option 1**, because it meets all three constraints with the fewest moving parts. Backend: Bun, Express 5, Zod and `bun:sqlite`. Client: React 19, Vite, React Router, Redux Toolkit, axios and Tailwind CSS 4. Tools: `bun test` and oxlint.

## Consequences

- Setup is short, and the database is a single file that needs no server.
- The jury needs both Bun and Node.js, because the Vite dev server runs on Node.js.
- `bun:sqlite` ties the persistence code to Bun, and SQL is written by hand with no migration tool. The repository interface keeps this in one layer, so changing the database does not touch the rules.
- There is no generated API documentation, so building block D would need extra work.
- `jsonwebtoken` is reserved for sign-in ([ADR-0002](0002-identity-and-sign-in.md)).
- The client also contains Capacitor projects for iOS and Android, although the [product vision](../product-vision.md) leaves native apps out. They are not part of what we deliver, and the team still has to decide whether to remove them.
