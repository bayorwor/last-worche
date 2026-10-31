<img src="docs/brand/logo.svg" alt="lastWorche logo" width="320">

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

Open <http://localhost:5173>. The app starts in German if your device's time zone is in Germany, Austria, Switzerland or Liechtenstein or your browser's first language is German, and in English otherwise. Switch with *DE / EN* in the header; your choice is remembered. On first start, the backend creates its tables in MySQL and adds sample data: the roles, six test users, three orders and their bookings. Order 4500012345 has 84 of 140 person-days used, order 4500012346 has only 0.5 of 20 free, and order 4500012347 belongs to a second project lead. Data survives a restart.

To delete all data, run `mysql -u root -p -e "DROP DATABASE lastworche"`, then the first Setup command again; the sample data returns on the next backend start. If you ran an earlier version and the backend fails while applying a database migration, this also resets it.

### If something does not start

| What you see | What to do |
|---|---|
| `ECONNREFUSED` on port `3306` when the backend starts | MySQL is not running. Start it, for example with `brew services start mysql`. |
| `mysql -u root -p` waits for a password you do not have | If your MySQL root has no password, press Enter, or run `mysql -u root < backend/setup-database.sql`. |
| `Access denied for user 'lastworche'` | The database user is missing. Run the first Setup command. |
| `EADDRINUSE` or a Vite port error | Port `3000` or `5173` is in use. Stop the other program. |
| The backend fails while applying a database migration | Reset the database as described above. |

## Test

One command, from the repository root:

```bash
(cd backend && bun test) && (cd client && bun test)
```

These tests need no database, so the 26 tests against real MySQL are reported as skipped. To include them, set `TEST_DATABASE_URL` as described in the [backend README](backend/README.md). They delete all bookings in that database, including the sample ones.

## Demo users

Open <http://localhost:5173> and sign in with no password:

1. Enter an email below, or choose one under *Testzugänge / Test accounts*, then choose *Code senden / Send code*.
2. Enter the 6-digit code. With the default `MAIL_MOCK=true` no email is sent, so the screen shows the code in a *Testmodus / Test mode* box, and *Code verwenden / Use code* enters it for you.
3. You land on the dashboard of that user's role.

To change user, choose *Abmelden / Sign out* at the top of the page. Labels are shown as German / English. All users are fictional.

| Role | Name | Email | What to try |
|---|---|---|---|
| Consultant | L. Hoffmann | `l.hoffmann@consultis.example` | Enter `9 bis 5 am Kundenportal, 1 h Mittag`, choose *Vorschlag prüfen / Check proposal*, then *Buchung bestätigen / Confirm booking*. To see a rejection, choose order 4500012346 first: it has too little budget left. |
| Project lead | A. Weber | `a.weber@client.example` | Open order 4500012345: after a 7 h booking, used goes from 84 to 84.875 person-days, and the booking appears in the list below it. Then approve the current month under *Leistungsnachweise / Proofs of work*: a consultant's next booking in that month is rejected. |
| Purchasing | K. Vogel | `k.vogel@client.example` | See totals per supplier and order, with no person or single booking. Order 4500012346 shows *Nachtrag nötig / Follow-up order needed*. |
| Consultant | M. Krüger | `m.krueger@consultis.example` | Assigned to one order only, so only that one can be chosen. |
| Consultant | S. Tanriver | `s.tanriver@nordlicht.example` | Works for another supplier, on orders 4500012346 and 4500012347. |
| Project lead | J. Schneider | `j.schneider@client.example` | Leads only order 4500012347, and cannot see A. Weber's orders. |

With the default `AI_MOCK=true`, the one-sentence booking returns a fixed proposal of 09:00–17:00 with 7 hours for today, whatever the sentence says. Confirming it a second time is rejected as an overlap, which shows that rule. To book other times, use the API as shown in the [backend README](backend/README.md).

## For teammates: which branch to test

**Test on `staging`.** It holds the next version of the product. Only use the others for the reasons below.

| Branch | What it is | Who uses it |
|---|---|---|
| **`staging`** | The next candidate for `main` | **Teammates testing the product** |
| `main` | The version the jury runs | Only for the final run check before the deadline |
| `development` | The latest merged work, which may still be rough | Developers checking that merges work together |
| `feature/<short-name>` | One change, not merged yet | Whoever reviews that pull request |

To switch to it, from the repository root:

```bash
git fetch origin
git switch staging
git pull
cd backend && bun install --frozen-lockfile && cd ..
cd client && bun install --frozen-lockfile && cd ..
```

Then start the apps as under [Run](#run), or on a phone as under [Test on a phone](#test-on-a-phone). The backend updates your database by itself when it starts.

- **Found a bug?** Report it with the branch, the test user and the steps. Fix it on a new `feature/` branch from `development`, never on `staging` itself.
- **Going back to an older branch?** An older version may not match your updated database. If the backend or a screen fails, reset the database as described under [Run](#run).

## Test on a phone

Start with the phone browser: it needs nothing installed on the phone, and works on iPhone and Android. Use the apps only when you need to test the mobile app itself. Do these steps on the branch you are testing, with [MySQL set up](#setup) on your computer.

| Way to test | Needs | Status |
|---|---|---|
| [Phone browser](#phone-browser-any-phone) | The phone and computer on the same Wi-Fi | Tested in a mobile browser mode on a computer, not yet on a physical phone |
| [iOS simulator app](#ios-simulator-app) | A Mac with Xcode | Tested |
| [iPhone app](#iphone-app) | A Mac with Xcode, an Apple ID and a cable | Network build tested in the simulator, not yet on a physical iPhone |
| [Android app](#android-app) | Android Studio and **Java 21** | **Not yet run:** the build needs Java 21, which the first test machine did not have |

Signing in works the same everywhere. With the default `MAIL_MOCK=true`, the screen shows the code, as described under [Demo users](#demo-users).

### Phone browser (any phone)

Start each in its own terminal, from the repository root:

```bash
cd backend && bun run start
```

```bash
cd client && bun run dev --host
```

Vite prints a `Network` address, such as `http://192.168.1.20:5173/`. Open that address in the phone's browser. If nothing loads, check that both are on the same Wi-Fi, and that your computer's firewall allows incoming connections. Some company and guest networks block this, so try a phone hotspot.

### iOS simulator app

```bash
cd backend && bun run start
```

```bash
cd client
bun run mobile:sync
bunx cap open ios
```

In Xcode, choose an iPhone simulator and press **Run**. The first launch after the simulator starts can show a white screen for about 10 seconds. The backend must be running on the same computer.

### iPhone app

`localhost` on a phone means the phone itself, so build the app with your computer's address. The phone and computer must be on the same Wi-Fi. On a Mac, `ipconfig getifaddr en0` prints the address. Use it below in place of `192.168.1.20`:

```bash
cd client
VITE_API_BASE_URL=http://192.168.1.20:3000/api bun run mobile:sync
bunx cap open ios
```

1. In Xcode, select the **App** target, then **Signing & Capabilities**, and choose your **Team**.
2. If Xcode rejects the bundle identifier, change `com.example.app` to something unique. Do not commit that change.
3. Connect the iPhone, choose it as the destination, and press **Run**.
4. If the iPhone says the developer is not trusted, allow it in **Settings → General → VPN & Device Management**.

If your computer's address changes, repeat these steps. When you are done, run `bun run mobile:sync` again to go back to the `localhost` address.

### Android app

Install **Java 21**, and in Android Studio choose it under **Settings → Build Tools → Gradle → Gradle JDK**. With an older version, the build fails with `invalid source release: 21`.

```bash
cd client
bun run mobile:sync
bunx cap open android
```

Choose an emulator or a phone connected by cable, and press **Run**. Then let the device reach your computer's backend through the cable connection, which also works for the emulator:

```bash
adb reverse tcp:3000 tcp:3000
```

Run that again whenever the device reconnects. If your `backend/.env` is older than this section, set `CORS_ORIGINS` as in `backend/.env.example`, or the app cannot reach the API.

### After pulling new changes

The apps hold a copy of the client, so they do not update by themselves. Run `bun run mobile:sync` in `client/` and press **Run** again. The phone browser updates by itself.

## Evidence map

Where the technical jury finds the evidence for each [technical criterion](https://github.com/DanielStuewe/article26-hackathon-2026/blob/main/docs/scoring.md).

| Criterion | Evidence |
|---|---|
| 1 · Persistence and data model | Schema in [migrations.ts](backend/src/repositories/migrations.ts), sample data in [seedData.ts](backend/src/repositories/seedData.ts), queries in [mysqlBookingRepository.ts](backend/src/repositories/mysqlBookingRepository.ts), [ER diagram](docs/domain.md) |
| 2 · Business rules and unit tests | Rules in [booking.ts](backend/src/domain/booking.ts) and [proofOfWork.ts](backend/src/domain/proofOfWork.ts), tests in [booking.test.ts](backend/src/domain/booking.test.ts) and [bookingService.test.ts](backend/src/services/bookingService.test.ts), simultaneous bookings in [mysqlBookingRepository.test.ts](backend/src/repositories/mysqlBookingRepository.test.ts) |
| 3 · Roles, permissions and privacy | [Permission concept](docs/roles-and-privacy.md), guards in [authentication.ts](backend/src/middlewares/authentication.ts), allowed roles per route in [bookingRoutes.ts](backend/src/routes/bookingRoutes.ts), row-level scope in [bookingService.ts](backend/src/services/bookingService.ts), totals with no personal data for purchasing in [purchasing.ts](backend/src/domain/purchasing.ts), rejections tested in [app.test.ts](backend/src/app.test.ts), role views in the [mockup](docs/mockup/index.html) and in [client/src/features](client/src/features) |
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
| `GET /api/auth/roles` | All roles, with names and descriptions in German and English | |
| `GET /api/auth/test-accounts` | The seeded test accounts | `404` when switched off |
| `POST /api/auth/request-code` | Email a 6-digit code. Answers the same for an unknown email. With `MAIL_MOCK=true`, the answer also contains the code | `400` invalid email |
| `POST /api/auth/verify-code` | Check the code, and receive a signed session token | `400` invalid input, `401` wrong or expired code |
| `GET /api/auth/me` | Who the session belongs to | `401` no valid session |
| `GET /api/orders` | Orders as ID and title, for all roles: a consultant sees their assigned orders, a project lead the orders they lead, purchasing all orders | `401` no session |
| `GET /api/consultants/:consultantId/bookings` | A consultant's own 10 latest bookings, for the consultant role | `401`, `403` another consultant |
| `GET /api/orders/:orderId/proofs-of-work` | Each month of an order with its totals and status, for the project lead of that order | `401`, `403` other roles or orders, `404` unknown order |
| `POST /api/orders/:orderId/proofs-of-work/:month/approve` | Approve a month for good, for the project lead of that order | `400` invalid month, `401`, `403`, `404`, `422` already approved or no bookings |
| `GET /api/purchasing/supplier-overview` | Totals per supplier and order, with nothing about a person, for the purchasing role | `401`, `403` other roles |
| `GET /api/orders/:orderId/bookings` | The 10 latest single bookings of an order, for the project lead of that order | `401`, `403` other roles or orders, `404` unknown order |
| `POST /api/bookings` | Check the rules, then store a booking, for the consultant role. The consultant comes from the session | `401`, `403` other roles, `400` invalid input, `404` unknown order, `422` rule violated, with `rule` and `values` so the client can explain it in either language |
| `GET /api/orders/:orderId/budget` | Ordered, used and free person-days, for all roles within their orders | `401`, `403` an order outside your scope, `404` unknown order |
| `POST /api/ai/parse-booking` | Turn one sentence into a booking proposal, without storing it, for the consultant role | `401`, `403` other roles, `400` invalid input, `503` AI service unavailable, with a `code` |

### Configuration

All values have safe defaults. See [backend/.env.example](backend/.env.example) and [client/.env.example](client/.env.example).

| Variable | Default | Meaning |
|---|---|---|
| `PORT` | `3000` | API port. The Vite dev server expects `3000`. |
| `DATABASE_URL` | `mysql://lastworche:lastworche@localhost:3306/lastworche` | MySQL connection, matching `backend/setup-database.sql`. For local development only. |
| `CORS_ORIGINS` | `capacitor://localhost,http://localhost` | Web addresses allowed to call the API. The defaults are the iOS and Android apps |
| `JWT_SECRET` | a value for local development only | Signs session tokens |
| `TEST_ACCOUNTS_ENABLED` | `true` | `true` lists the test accounts on the sign-in screen. Use `false` on any shared server |
| `AI_MOCK` | `true` | `true` returns a fixed AI proposal, `false` calls OpenRouter |
| `OPENROUTER_API_KEY` | not set | Only needed with `AI_MOCK=false` |
| `OPENROUTER_MODEL` | `openrouter/auto` | Model to use. `openrouter/auto` lets OpenRouter pick one per request. |
| `MAIL_MOCK` | `true` | `true` sends no email and shows sign-in codes on the screen, which lets anyone sign in as anyone. `false` sends them, and is required on any shared server |
| `MAIL_FROM` | `lastWorche <no-reply@lastworche.example>` | Sender of emails |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` | not set, port `587` | Mail server, only needed with `MAIL_MOCK=false` |
| `TEST_DATABASE_URL` | not set | Optional MySQL connection for the database tests |
| `VITE_API_BASE_URL` | `/api`, or the address in [client/.env.mobile](client/.env.mobile) for the mobile apps. Set it yourself for a [physical iPhone](#iphone-app) | Client: base URL of the API |

## Status

| Area | Built | Planned |
|---|---|---|
| Core flow | Choose an assigned order, book time on it, see the effect on its budget | Manual booking form, without the AI sentence |
| Business rules | Free budget of an order, safe for simultaneous bookings; booking only on assigned orders; overlapping bookings of one person; 10-hour day; 11-hour rest; no bookings in an approved month | Vacation and public holidays, order period |
| Data model | Orders, bookings, consultants, suppliers, accounting objects, assignments, roles, users, proofs of work, with migrations | Vacation days, framework agreements |
| Roles | Sign-in with a 6-digit code by email, roles and users stored in the database, one view per role, server-side role checks on every route and row-level scope | Limits per network address, single sign-on per customer ([ADR-0002](docs/adr/0002-identity-and-sign-in.md), [ADR-0014](docs/adr/0014-email-code-sign-in.md)) |
| Budget | Ordered, used and free person-days | Forecast and early warning |
| Proof of work | A project lead approves a month per order, which locks it | Passing approved hours on to finance |
| Mobile | Responsive screens in a phone browser, iOS app in the simulator | The apps on physical phones, Android ([Test on a phone](#test-on-a-phone)) |
| Purchasing | Totals per supplier and order from the database, with no personal data | Framework agreements |
| Languages | Client screens, server errors and sign-in emails in German and English | Other emails, which need a stored language per user |
| Email | Sign-in codes, with a mock switch. Real sending is not tested yet | After Sprint One: budget warnings, proof of work, rejected bookings, the single sign-on process ([ADR-0008](docs/adr/0008-email-with-nodemailer.md)) |

## Documentation

- [Product vision](docs/product-vision.md): who it is for, core flow, what we leave out
- [Domain model](docs/domain.md): glossary and ER diagram
- [Roles and privacy](docs/roles-and-privacy.md): role matrix and personal data
- Decisions: [0001 Technology stack](docs/adr/0001-technology-stack.md) · [0002 Identity and sign-in](docs/adr/0002-identity-and-sign-in.md) · [0003 Operation and scaling](docs/adr/0003-operation-and-scaling.md) · [0004 Code structure](docs/adr/0004-code-structure.md) · [0005 AI booking assistant](docs/adr/0005-ai-booking-assistant.md) (replaced) · [0006 MySQL database](docs/adr/0006-mysql-database.md) · [0007 OpenRouter for AI](docs/adr/0007-openrouter-ai-gateway.md) · [0008 Email with nodemailer](docs/adr/0008-email-with-nodemailer.md) · [0009 Languages and location default](docs/adr/0009-languages-and-location-default.md) · [0010 Simple database migrations](docs/adr/0010-simple-database-migrations.md) · [0011 MySQL without Docker](docs/adr/0011-mysql-without-docker.md) · [0012 Branching workflow](docs/adr/0012-branching-workflow.md) · [0013 Email and password sign-in](docs/adr/0013-email-and-password-sign-in.md) (replaced) · [0014 Sign-in with a code by email](docs/adr/0014-email-code-sign-in.md)
- [Mockup](docs/mockup/index.html) and its [visual direction](docs/mockup/README.md)
- [Brand assets](docs/brand/README.md): logo files and where each is used
- [Pitch](docs/pitch.md): the story and the live demo, step by step
- [AGENTS.md](AGENTS.md): instructions for AI coding agents

## Branching workflow

Every change moves through `feature/<short-name>` → `development` → `staging` → `main`. Never commit directly to `development`, `staging` or `main`. `main` is the version the jury runs, as it stands on Tuesday 3 Nov 2026 at 11:00, so anything not merged into it by then does not count. The reasons are in [ADR-0012](docs/adr/0012-branching-workflow.md).

### 1. Start a feature branch

Always start from the latest `development`. Use a short name, such as `feature/ten-hour-day`, and keep each branch to one story, task or fix.

```bash
git fetch origin
git switch development
git pull
git switch -c feature/<short-name>
```

### 2. Commit your work

Use one-line messages with no body, starting with `feat:`, `fix:`, `docs:` or `test:`. Make small commits, at least two per hackathon day across the team.

```bash
git add <files>
git commit -m "feat: reject bookings above 10 hours per day"
```

### 3. Check it before you push

From the repository root:

```bash
cd backend && bun run typecheck && bun test && cd ..
cd client && bun test && bun run lint && bun run build && cd ..
```

If `development` has moved on since you started, bring those changes in and run the checks again:

```bash
git fetch origin
git merge origin/development
```

### 4. Merge into `development`

Push the branch, then open a pull request on GitHub from your branch into `development`. Another team member reviews it, then merges it with **Create a merge commit**.

```bash
git push -u origin feature/<short-name>
```

### 5. Promote to `staging`, then `main`

Open each pull request on GitHub, and merge it with **Create a merge commit**. Promote at least once a day.

| Pull request | Merge when |
|---|---|
| `development` → `staging` | All the checks in step 3 pass on `development` |
| `staging` → `main` | Someone has followed this README's Setup, Run and Test sections from a fresh clone of `staging`, within 5 minutes |

**Never use "Squash and merge".** It turns a day's commits into one, and the jury scores the Git history commit by commit.

## Team

- [bayorwor](https://github.com/bayorwor)
