# lastWorche

*Jede Stunde im Blick* (every hour you buy, in view). lastWorche lets project leads at large companies see what every hour booked by external consultants does to an order's budget, and checks each booking against the rules on the server before it is stored. See the [product vision](docs/product-vision.md).

Built for the Article26 Hackathon 2026, on the working code track.

## Prerequisites

| Tool | Version | Check | Used for |
|---|---|---|---|
| [Bun](https://bun.com) | 1.4.x | `bun --version` | Installing packages, running the backend and tests |
| [Node.js](https://nodejs.org) | 22.12 or newer | `node --version` | Running the Vite dev server |
| [Docker](https://www.docker.com/products/docker-desktop/) with Compose, running | Compose v2 | `docker compose version` | Running the MySQL database |

Ports `3000` (API), `3306` (MySQL) and `5173` (web app) must be free. No paid account or API key is needed.

## Setup

From the repository root. The first run downloads the MySQL image.

```bash
docker compose up -d --wait
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

Open <http://localhost:5173>. On first start, the backend creates its tables in MySQL with one sample order, 4500012345, with a budget of 140 person-days. Data survives a restart.

To stop the database, run `docker compose down`. Add `-v` to delete its data as well.

## Test

```bash
cd backend && bun test
```

These tests need no database, so the 5 tests against real MySQL are reported as skipped. To include them, set `TEST_DATABASE_URL` as described in the [backend README](backend/README.md). They delete all bookings in that database.

## Demo users

There is no login yet. Choose a role with the tabs at the top of the page.

| Role | Sign in with | What to try |
|---|---|---|
| Consultant (Berater) | Tab *Berater* | Enter `9 bis 5 am Kundenportal, 1 h Mittag`, choose *Vorschlag prüfen*, then *Buchung bestätigen*. |
| Project lead (Projektleitung) | Tab *Projektleitung* | See the used and free person-days change after the booking. |
| Purchasing (Einkauf) | Tab *Einkauf* | See the supplier overview with aggregated values only. These are sample values for now. |

With the default `AI_MOCK=true`, the one-sentence booking returns a fixed proposal of 7 hours for today, whatever the sentence says.

## Evidence map

Where the technical jury finds the evidence for each [technical criterion](https://github.com/DanielStuewe/article26-hackathon-2026/blob/main/docs/scoring.md).

| Criterion | Evidence |
|---|---|
| 1 · Persistence and data model | Schema and seed data in [database.ts](backend/src/repositories/database.ts), queries in [mysqlBookingRepository.ts](backend/src/repositories/mysqlBookingRepository.ts), [ER diagram](docs/domain.md) |
| 2 · Business rules and unit tests | Rule in [booking.ts](backend/src/domain/booking.ts), tests in [booking.test.ts](backend/src/domain/booking.test.ts) and [bookingService.test.ts](backend/src/services/bookingService.test.ts), simultaneous bookings in [mysqlBookingRepository.test.ts](backend/src/repositories/mysqlBookingRepository.test.ts) |
| 3 · Roles, permissions and privacy | [Permission concept](docs/roles-and-privacy.md), role views in the [mockup](docs/mockup/index.html) and in [client/src/features](client/src/features) |
| 4 · Architecture and engineering | **A** · structure in [backend/src](backend/src) and [client/src](client/src) · **B** · [ADRs](docs/adr/) · **C** · Git history · **E** (database only) · [compose.yaml](compose.yaml) · **F** · [mockup](docs/mockup/index.html) |

Building block D (API documentation) is not delivered: the API is described below, but not in a machine-readable form. For block E, the Compose file starts only the database, not the backend or client.

## Tech stack

| Area | Choice | Decision |
|---|---|---|
| Language | TypeScript | [ADR-0001](docs/adr/0001-technology-stack.md) |
| Backend | Bun, Express 5, Zod | [ADR-0001](docs/adr/0001-technology-stack.md) |
| Database | MySQL 8.4 (`mysql2`), started with Docker Compose | [ADR-0006](docs/adr/0006-mysql-database.md) |
| Frontend | React 19, Vite, React Router, Redux Toolkit, axios, Tailwind CSS 4 | [ADR-0001](docs/adr/0001-technology-stack.md) |
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
| `POST /api/bookings` | Check the rules, then store a booking | `400` invalid input, `404` unknown order, `422` rule violated |
| `GET /api/orders/:orderId/budget` | Ordered, used and free person-days | `404` unknown order |
| `POST /api/ai/parse-booking` | Turn one sentence into a booking proposal, without storing it | `400` invalid input, `503` AI service unavailable |

### Configuration

All values have safe defaults. See [backend/.env.example](backend/.env.example) and [client/.env.example](client/.env.example).

| Variable | Default | Meaning |
|---|---|---|
| `PORT` | `3000` | API port. The Vite dev server expects `3000`. |
| `DATABASE_URL` | `mysql://lastworche:lastworche@localhost:3306/lastworche` | MySQL connection, matching `compose.yaml`. For local development only. |
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
| Core flow | Book time on an order, see the effect on its budget | Choosing from the consultant's assigned orders |
| Business rules | Free budget of an order, safe for simultaneous bookings | Overlapping bookings, 10-hour day, 11-hour rest, vacation and public holidays, order period |
| Data model | Orders and bookings | Consultants, suppliers, accounting objects, assignments, proofs of work |
| Roles | Role views in the client, written permission concept | Sign-in, permission checks on the server ([ADR-0002](docs/adr/0002-identity-and-sign-in.md)) |
| Budget | Ordered, used and free person-days | Forecast and early warning |
| Purchasing | Screen with sample values | Aggregated supplier endpoint |
| Email | Sending service with a mock switch, not used by any feature | After Sprint One: budget warnings, proof of work, rejected bookings, the single sign-on process ([ADR-0008](docs/adr/0008-email-with-nodemailer.md)) |

## Documentation

- [Product vision](docs/product-vision.md): who it is for, core flow, what we leave out
- [Domain model](docs/domain.md): glossary and ER diagram
- [Roles and privacy](docs/roles-and-privacy.md): role matrix and personal data
- Decisions: [0001 Technology stack](docs/adr/0001-technology-stack.md) · [0002 Identity and sign-in](docs/adr/0002-identity-and-sign-in.md) · [0003 Operation and scaling](docs/adr/0003-operation-and-scaling.md) · [0004 Code structure](docs/adr/0004-code-structure.md) · [0005 AI booking assistant](docs/adr/0005-ai-booking-assistant.md) (replaced) · [0006 MySQL database](docs/adr/0006-mysql-database.md) · [0007 OpenRouter for AI](docs/adr/0007-openrouter-ai-gateway.md) · [0008 Email with nodemailer](docs/adr/0008-email-with-nodemailer.md)
- [Mockup](docs/mockup/index.html) and its [visual direction](docs/mockup/README.md)
- [AGENTS.md](AGENTS.md): instructions for AI coding agents

## Team

- [bayorwor](https://github.com/bayorwor)
