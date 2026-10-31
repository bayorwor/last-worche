# backend

lastWorche API, running on Bun, Express and MySQL. No API key or mail server is needed: `AI_MOCK=true` returns a fixed AI proposal, and `MAIL_MOCK=true` writes emails to the log.

MySQL must be installed and running. To create the database and user once, run this from the repository root: `mysql -u root -p < backend/setup-database.sql`.

```bash
bun install
cp .env.example .env
bun run dev         # http://localhost:3000, reloads on change
bun run start       # without reload
bun test            # unit tests, no database needed
bun run typecheck
```

To also run the tests against real MySQL, set `TEST_DATABASE_URL`. **These tests delete all bookings in that database.**

```bash
TEST_DATABASE_URL=mysql://lastworche:lastworche@localhost:3306/lastworche bun test
```

## Structure

Requests travel down through the layers. Inner layers never import outer ones, and `domain/` imports no framework or database code.

```
server.ts            entry point: connects to the database, starts listening
src/
  app.ts             creates the Express app and connects the layers
  routes/            maps URLs to controllers
  middlewares/       request validation, central error handling
  controllers/       HTTP only: read the request, call a service, write the response
  dtos/              shape of data crossing HTTP
  services/          use cases, the OpenRouter call and email sending
  templates/         AI prompts
  domain/            business rules and their errors, which carry a rule name and values so the client can translate them
  repositories/      storage: the interface services use, its MySQL version, an in-memory version for tests, migrations and sample data
  config/            validated environment, mail transport
```

## Try it

```bash
curl -X POST localhost:3000/api/bookings -H 'Content-Type: application/json' \
  -d '{"orderId":"4500012345","consultantId":"consultant-1","date":"2026-10-27","startTime":"09:00","endTime":"17:00","hours":7,"description":"Legacy data reconciliation"}'

curl localhost:3000/api/orders/4500012345/budget

curl localhost:3000/api/consultants/consultant-2/orders

# rejected with 422: consultant-2 is not assigned to this order
curl -X POST localhost:3000/api/bookings -H 'Content-Type: application/json' \
  -d '{"orderId":"4500012346","consultantId":"consultant-2","date":"2026-10-27","startTime":"09:00","endTime":"10:00","hours":1,"description":"Report review"}'

curl -X POST localhost:3000/api/ai/parse-booking -H 'Content-Type: application/json' \
  -d '{"sentence":"9 bis 5 am Kundenportal, 1 h Mittag"}'
```
