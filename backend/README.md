# backend

lastWorche API, running on Bun, Express and MySQL. No API key or mail server is needed: `AI_MOCK=true` reads one-sentence bookings with plain rules, and `MAIL_MOCK=true` sends no email and shows sign-in codes on the screen.

MySQL must be installed and running. To create the database and user once, run this from the repository root: `mysql -u root -p < backend/setup-database.sql`.

```bash
bun install
cp .env.example .env
bun run dev         # http://localhost:3000, reloads on change
bun run start       # without reload
bun test            # unit tests, no database needed
bun run typecheck
```

To also run the tests against real MySQL, set `TEST_DATABASE_URL`. **These tests delete all bookings and activity in that database.**

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
  middlewares/       sign-in and role checks, request validation, central error handling
  controllers/       HTTP only: read the request, call a service, write the response
  dtos/              shape of data crossing HTTP
  services/          use cases, the OpenRouter call and email sending
  templates/         AI prompts
  domain/            business rules and their errors, which carry a rule name and values so the client can translate them
  repositories/      storage: the interface services use, its MySQL version, an in-memory version for tests, migrations and sample data
  config/            validated environment, mail transport
  docs/              the API in machine-readable form, with a test that compares it with the routes
```

## Try it

```bash
# Sign in as a test user: ask for a code, then confirm it. With MAIL_MOCK=true, the answer contains the code.
# The README lists all test users.
CODE=$(curl -s -X POST localhost:3000/api/auth/request-code -H 'Content-Type: application/json' \
  -d '{"email":"l.hoffmann@consultis.example"}' | sed -E 's/.*"testCode":"([0-9]+)".*/\1/')

TOKEN=$(curl -s -X POST localhost:3000/api/auth/verify-code -H 'Content-Type: application/json' \
  -d "{\"email\":\"l.hoffmann@consultis.example\",\"code\":\"$CODE\"}" | sed -E 's/.*"token":"([^"]+)".*/\1/')

curl -X POST localhost:3000/api/bookings -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"orderId":"4500012345","date":"2026-10-27","startTime":"09:00","endTime":"17:00","hours":7,"description":"Legacy data reconciliation"}'

curl localhost:3000/api/orders/4500012345/budget

curl localhost:3000/api/orders -H "Authorization: Bearer $TOKEN"

# rejected with 401: no session
curl -X POST localhost:3000/api/bookings -H 'Content-Type: application/json' \
  -d '{"orderId":"4500012346","date":"2026-10-27","startTime":"09:00","endTime":"10:00","hours":1,"description":"Report review"}'

curl -X POST localhost:3000/api/ai/parse-booking -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"sentence":"9 bis 5 am Kundenportal, 1 h Mittag"}'
```

## Time tracking interface

A supplier's own system can send hours through the same rules as a booking by hand. All rows or none are stored, and a rejection names the row ([ADR-0017](../docs/adr/0017-supplier-interface.md)). The demo keys are in `.env.example`.

```bash
curl -X POST localhost:3000/api/integrations/time-tracking/bookings \
  -H 'X-Api-Key: demo-consultis-key' -H 'Content-Type: application/json' \
  -d '{"bookings":[{"consultantId":"consultant-1","orderId":"4500012345","date":"2026-11-04","startTime":"09:00","endTime":"17:00","hours":7,"description":"Portal development"}]}'
```

The API documentation is at <http://localhost:3000/api/docs>.
