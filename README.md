# lastWorche

*Jede Stunde im Blick* (every hour you buy, in view). lastWorche lets project leads at large companies see what every hour booked by external consultants does to an order's budget, and checks each booking against the rules on the server before it is stored. See the [product vision](docs/product-vision.md).

Built for the Article26 Hackathon 2026, on the working code track.

## Prerequisites

| Tool | Version | Check | Used for |
|---|---|---|---|
| [Bun](https://bun.com) | 1.4.x | `bun --version` | Installing packages, running the backend and tests |
| [Node.js](https://nodejs.org) | 22.12 or newer | `node --version` | Running the Vite dev server |
| [MySQL](https://dev.mysql.com/downloads/mysql/), installed and running | 8.4 or newer | `mysql --version` | The database |

MySQL must listen on port `3306`, and ports `3000` (API) and `5173` (web app) must be free. No paid account or API key is needed.

## Setup

From the repository root. The first command asks for your MySQL root password, and creates the `lastworche` database and user.

```bash
mysql -u root -p < backend/setup-database.sql
cd backend && bun install --frozen-lockfile && cp .env.example .env && cd ..
cd client && bun install --frozen-lockfile && cd ..
```

## Run

Start each app in its own terminal, from the repository root:

```bash
cd backend && bun run start   # API on http://localhost:3000
```

```bash
cd client && bun run dev      # web app on http://localhost:5173
```

Open <http://localhost:5173>. The app starts in German if your device's time zone is in Germany, Austria, Switzerland or Liechtenstein or your browser's first language is German, and in English otherwise. Switch with *DE / EN* in the header; your choice is remembered. On first start, the backend creates its tables in MySQL and adds sample data: two orders, three consultants and their bookings. Order 4500012345 has 84 of 140 person-days used, and order 4500012346 has only 0.5 of 20 free. Data survives a restart.

To delete all data, run `mysql -u root -p -e "DROP DATABASE lastworche"`, then the first Setup command again; the sample data returns on the next backend start. If you ran an earlier version and the backend fails while applying a database migration, this also resets it.

## Test

```bash
cd backend && bun test
cd client && bun test
```

These tests need no database, so the 7 tests against real MySQL are reported as skipped. To include them, set `TEST_DATABASE_URL` as described in the [backend README](backend/README.md). They delete all bookings in that database, including the sample ones.

## Demo users

There is no login yet, so the demo users below are stored but cannot sign in. Choose a role with the tabs at the top of the page. Labels are shown as German / English.

| Role | Demo user | Sign in with | What to try |
|---|---|---|---|
| Consultant | L. Hoffmann | Tab *Berater / Consultant* | Enter `9 bis 5 am Kundenportal, 1 h Mittag`, choose *Vorschlag prüfen / Check proposal*, then *Buchung bestätigen / Confirm booking*. To see a rejection, choose order 4500012346 first: it has too little budget left. |
| Project lead | A. Weber | Tab *Projektleitung / Project lead* | Open order 4500012345: after a 7 h booking, used goes from 84 to 84.875 person-days. |
| Purchasing | K. Vogel | Tab *Einkauf / Purchasing* | See the supplier overview with aggregated values only. These are sample values for now. |

With the default `AI_MOCK=true`, the one-sentence booking returns a fixed proposal of 7 hours for today, whatever the sentence says.

## Evidence map

Where the technical jury finds the evidence for each [technical criterion](https://github.com/DanielStuewe/article26-hackathon-2026/blob/main/docs/scoring.md).

| Criterion | Evidence |
|---|---|
| 1 · Persistence and data model | Schema in [migrations.ts](backend/src/repositories/migrations.ts), sample data in [seedData.ts](backend/src/repositories/seedData.ts), queries in [mysqlBookingRepository.ts](backend/src/repositories/mysqlBookingRepository.ts), [ER diagram](docs/domain.md) |
| 2 · Business rules and unit tests | Rules in [booking.ts](backend/src/domain/booking.ts), tests in [booking.test.ts](backend/src/domain/booking.test.ts) and [bookingService.test.ts](backend/src/services/bookingService.test.ts), simultaneous bookings in [mysqlBookingRepository.test.ts](backend/src/repositories/mysqlBookingRepository.test.ts) |
| 3 · Roles, permissions and privacy | [Permission concept](docs/roles-and-privacy.md), role views in the [mockup](docs/mockup/index.html) and in [client/src/features](client/src/features) |
| 4 · Architecture and engineering | **A** · structure in [backend/src](backend/src) and [client/src](client/src) · **B** · [ADRs](docs/adr/) · **C** · Git history · **F** · [mockup](docs/mockup/index.html) |

Building block D (API documentation) is not delivered: the API is described below, but not in a machine-readable form. Building block E (containers) is not delivered, as decided in [ADR-0011](docs/adr/0011-mysql-without-docker.md).

## Tech stack

| Area | Choice | Decision |
|---|---|---|
| Language | TypeScript | [ADR-0001](docs/adr/0001-technology-stack.md) |
| Backend | Bun, Express 5, Zod | [ADR-0001](docs/adr/0001-technology-stack.md) |
| Database | MySQL 8.4 or newer (`mysql2`), installed on the machine | [ADR-0006](docs/adr/0006-mysql-database.md), [ADR-0011](docs/adr/0011-mysql-without-docker.md) |
| Frontend | React 19, Vite, React Router, Redux Toolkit, axios, Tailwind CSS 4 | [ADR-0001](docs/adr/0001-technology-stack.md) |
| Languages | German and English, default from the device's time zone | [ADR-0009](docs/adr/0009-languages-and-location-default.md) |
| Tests and lint | `bun test`, oxlint | [ADR-0001](docs/adr/0001-technology-stack.md) |
| AI | OpenRouter, with a mock switch | [ADR-0007](docs/adr/0007-openrouter-ai-gateway.md) |
| Email | nodemailer over SMTP, with a mock switch | [ADR-0008](docs/adr/0008-email-with-nodemailer.md) |

## Architecture

The backend is layered, and inner layers never import outer ones. The client is split by feature, and each role page loads as its own chunk. See [ADR-0004](docs/adr/0004-code-structure.md), the [backend README](backend/README.md) and the [client README](client/README.md).

```mermaid
flowchart LR
    Browser["React client"] -->|"/api"| Routes
    subgraph Backend
        Routes["routes + middlewares"] --> Controllers
        Controllers --> Services
        Services --> Domain["domain: business rules"]
        Services --> Repositories
    end
    Repositories --> MySQL[("MySQL")]
    Services -.->|"only with AI_MOCK=false"| OpenRouter["OpenRouter"]
    Services -.->|"only with MAIL_MOCK=false"| SMTP["Mail server"]
```

### API

| Method and path | Purpose | Errors |
|---|---|---|
| `GET /api/orders` | All orders, as ID and title | |
| `GET /api/consultants/:consultantId/orders` | Only the orders this consultant is assigned to | |
| `POST /api/bookings` | Check the rules, then store a booking | `400` invalid input, `404` unknown order, `422` rule violated, with `rule` and `values` so the client can explain it in either language |
| `GET /api/orders/:orderId/budget` | Ordered, used and free person-days | `404` unknown order |
| `POST /api/ai/parse-booking` | Turn one sentence into a booking proposal, without storing it | `400` invalid input, `503` AI service unavailable, with a `code` |

### Configuration

All values have safe defaults. See [backend/.env.example](backend/.env.example) and [client/.env.example](client/.env.example).

| Variable | Default | Meaning |
|---|---|---|
| `PORT` | `3000` | API port. The Vite dev server expects `3000`. |
| `DATABASE_URL` | `mysql://lastworche:lastworche@localhost:3306/lastworche` | MySQL connection, matching `backend/setup-database.sql`. For local development only. |
| `AI_MOCK` | `true` | `true` returns a fixed AI proposal, `false` calls OpenRouter |
| `OPENROUTER_API_KEY` | not set | Only needed with `AI_MOCK=false` |
| `OPENROUTER_MODEL` | `openrouter/auto` | Model to use. `openrouter/auto` lets OpenRouter pick one per request. |
| `MAIL_MOCK` | `true` | `true` writes emails to the server log, `false` sends them |
| `MAIL_FROM` | `lastWorche <no-reply@lastworche.example>` | Sender of emails |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` | not set, port `587` | Mail server, only needed with `MAIL_MOCK=false` |
| `TEST_DATABASE_URL` | not set | Optional MySQL connection for the database tests |
| `VITE_API_BASE_URL` | `/api` | Client: base URL of the API |

## Status

| Area | Built | Planned |
|---|---|---|
| Core flow | Choose an assigned order, book time on it, see the effect on its budget | Manual booking form, without the AI sentence |
| Business rules | Free budget of an order, safe for simultaneous bookings; booking only on assigned orders | Overlapping bookings, 10-hour day, 11-hour rest, vacation and public holidays, order period |
| Data model | Orders, bookings, consultants, suppliers, accounting objects, assignments, demo users, with migrations | Proofs of work |
| Roles | Role views in the client, written permission concept. Until sign-in exists, the assignment rule trusts the consultant ID in the request | Sign-in, permission checks on the server ([ADR-0002](docs/adr/0002-identity-and-sign-in.md)) |
| Budget | Ordered, used and free person-days | Forecast and early warning |
| Purchasing | Screen with sample values | Aggregated supplier endpoint |
| Languages | Client screens and server errors in German and English | Emails, which need a stored language per user |
| Email | Sending service with a mock switch, not used by any feature | After Sprint One: budget warnings, proof of work, rejected bookings, the single sign-on process ([ADR-0008](docs/adr/0008-email-with-nodemailer.md)) |

## Documentation

- [Product vision](docs/product-vision.md): who it is for, core flow, what we leave out
- [Domain model](docs/domain.md): glossary and ER diagram
- [Roles and privacy](docs/roles-and-privacy.md): role matrix and personal data
- Decisions: [0001 Technology stack](docs/adr/0001-technology-stack.md) · [0002 Identity and sign-in](docs/adr/0002-identity-and-sign-in.md) · [0003 Operation and scaling](docs/adr/0003-operation-and-scaling.md) · [0004 Code structure](docs/adr/0004-code-structure.md) · [0005 AI booking assistant](docs/adr/0005-ai-booking-assistant.md) (replaced) · [0006 MySQL database](docs/adr/0006-mysql-database.md) · [0007 OpenRouter for AI](docs/adr/0007-openrouter-ai-gateway.md) · [0008 Email with nodemailer](docs/adr/0008-email-with-nodemailer.md) · [0009 Languages and location default](docs/adr/0009-languages-and-location-default.md) · [0010 Simple database migrations](docs/adr/0010-simple-database-migrations.md) · [0011 MySQL without Docker](docs/adr/0011-mysql-without-docker.md)
- [Mockup](docs/mockup/index.html) and its [visual direction](docs/mockup/README.md)
- [AGENTS.md](AGENTS.md): instructions for AI coding agents

## Team

- [bayorwor](https://github.com/bayorwor)
