// The API in machine-readable form (OpenAPI 3.1), shown as Swagger UI at /api/docs. A test compares it with
// the route files, so a new route cannot be left undocumented.
const session = [{ session: [] }];
const supplierKey = [{ supplierKey: [] }];

const errors = {
  "400": { description: "Invalid input" },
  "401": { description: "No valid session" },
  "403": { description: "This role, or this person, may not do this" },
  "404": { description: "Not found" },
  "422": { description: "A business rule rejected this. `rule` names it, and `values` hold its details", content: { "application/json": { schema: { $ref: "#/components/schemas/RuleError" } } } },
};

function ok(description: string, schema?: object) {
  return { description, ...(schema ? { content: { "application/json": { schema } } } : {}) };
}

function body(schema: object) {
  return { required: true, content: { "application/json": { schema } } };
}

function operation(summary: string, tag: string, roles: string, responses: object, extra: object = {}) {
  return { summary, tags: [tag], description: `Allowed: ${roles}.`, security: session, responses, ...extra };
}

const orderIdParameter = { name: "orderId", in: "path", required: true, schema: { type: "string" }, example: "4500012345" };
const monthParameter = { name: "month", in: "path", required: true, schema: { type: "string" }, example: "2026-10" };
const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });

export const openapiDocument = {
  openapi: "3.1.0",
  info: {
    title: "lastWorche API",
    version: "1.0.0",
    description:
      "Time booking and budget steering. Every booking is checked against the business rules on the server. To try it: request a code with `/auth/request-code`, confirm it with `/auth/verify-code`, and use the returned token under *Authorize*.",
  },
  servers: [{ url: "/api" }],
  tags: [
    { name: "Sign-in and profile" },
    { name: "Bookings" },
    { name: "Orders and budget" },
    { name: "Proof of work" },
    { name: "Forecast and follow-up" },
    { name: "Purchasing" },
    { name: "Activity" },
    { name: "Interface" },
    { name: "Operation" },
  ],
  paths: {
    "/health": {
      get: { summary: "Whether the API and its database work", tags: ["Operation"], description: "Open to everyone.", responses: { "200": ok("Working"), "503": { description: "The database cannot be reached" } } },
    },
    "/auth/roles": {
      get: { summary: "All roles, in German and English", tags: ["Sign-in and profile"], description: "Open to everyone.", responses: { "200": ok("The roles") } },
    },
    "/auth/test-accounts": {
      get: { summary: "The seeded test accounts", tags: ["Sign-in and profile"], description: "Open to everyone. 404 when switched off.", responses: { "200": ok("The accounts"), "404": errors["404"] } },
    },
    "/auth/request-code": {
      post: {
        summary: "Email a 6-digit code",
        tags: ["Sign-in and profile"],
        description: "Open to everyone, with a limit per network address. Answers the same for an unknown email. With MAIL_MOCK=true, the answer also holds the code.",
        requestBody: body({ type: "object", required: ["email"], properties: { email: { type: "string", format: "email" }, language: { enum: ["de", "en"] } } }),
        responses: { "200": ok("Done"), "400": errors["400"], "429": { description: "Too many attempts" } },
      },
    },
    "/auth/verify-code": {
      post: {
        summary: "Confirm the code and receive a session token",
        tags: ["Sign-in and profile"],
        description: "Open to everyone, with a limit per network address.",
        requestBody: body({ type: "object", required: ["email", "code"], properties: { email: { type: "string", format: "email" }, code: { type: "string", pattern: "^\\d{6}$" } } }),
        responses: { "200": ok("The token and the user"), "400": errors["400"], "401": { description: "Wrong or expired code" }, "429": { description: "Too many attempts" } },
      },
    },
    "/auth/me": {
      get: operation("Who the session belongs to", "Sign-in and profile", "every role", { "200": ok("The user", ref("User")), "401": errors["401"] }),
      patch: operation("Change your own name", "Sign-in and profile", "every role, for themselves. Email and role cannot be changed", { "200": ok("The user", ref("User")), "400": errors["400"], "401": errors["401"] }, {
        requestBody: body({ type: "object", required: ["name"], properties: { name: { type: "string", minLength: 2, maxLength: 100 } } }),
      }),
    },
    "/bookings": {
      post: operation("Store a booking, after all rules passed", "Bookings", "consultant, as themselves", { "201": ok("The booking"), "400": errors["400"], "401": errors["401"], "403": errors["403"], "404": errors["404"], "422": errors["422"] }, { requestBody: body(ref("NewBooking")) }),
    },
    "/bookings/check": {
      post: operation("Run every rule without storing anything", "Bookings", "consultant, as themselves", { "200": ok("Each rule's result, the budget afterwards and a free time after an overlap"), "400": errors["400"], "401": errors["401"], "403": errors["403"], "404": errors["404"] }, { requestBody: body(ref("NewBooking")) }),
    },
    "/ai/parse-booking": {
      post: operation("Turn one sentence into a booking proposal", "Bookings", "consultant", { "200": ok("The proposal, which is not stored"), "400": errors["400"], "401": errors["401"], "403": errors["403"], "503": { description: "The sentence could not be read" } }, {
        requestBody: body({ type: "object", required: ["sentence"], properties: { sentence: { type: "string", maxLength: 500 }, today: { type: "string", format: "date" } } }),
      }),
    },
    "/consultants/{consultantId}/bookings": {
      get: operation("A consultant's recent bookings", "Bookings", "consultant, only their own", { "200": ok("The bookings"), "401": errors["401"], "403": errors["403"] }, {
        parameters: [{ name: "consultantId", in: "path", required: true, schema: { type: "string" } }],
      }),
    },
    "/orders": {
      get: operation("The orders this user may see", "Orders and budget", "every role, scoped by row", { "200": ok("The orders"), "401": errors["401"] }),
    },
    "/orders/{orderId}/budget": {
      get: operation("Ordered, used and free person-days", "Orders and budget", "the order's lead, its consultants, and purchasing", { "200": ok("The budget"), "401": errors["401"], "403": errors["403"], "404": errors["404"] }, { parameters: [orderIdParameter] }),
    },
    "/orders/{orderId}/bookings": {
      get: operation("An order's recent bookings, with names", "Orders and budget", "the order's project lead", { "200": ok("The bookings"), "401": errors["401"], "403": errors["403"], "404": errors["404"] }, { parameters: [orderIdParameter] }),
    },
    "/orders/{orderId}/proofs-of-work": {
      get: operation("Totals per month, and whether each is approved", "Proof of work", "the order's project lead", { "200": ok("The months"), "401": errors["401"], "403": errors["403"], "404": errors["404"] }, { parameters: [orderIdParameter] }),
    },
    "/orders/{orderId}/proofs-of-work/{month}/approve": {
      post: operation("Approve a month, which locks it", "Proof of work", "the order's project lead", { "200": ok("The months"), "400": errors["400"], "401": errors["401"], "403": errors["403"], "404": errors["404"], "422": errors["422"] }, { parameters: [orderIdParameter, monthParameter] }),
    },
    "/orders/{orderId}/proofs-of-work/{month}/export.csv": {
      get: operation("An approved month as a CSV file for finance", "Proof of work", "the order's project lead", { "200": { description: "The file", content: { "text/csv": {} } }, "400": errors["400"], "401": errors["401"], "403": errors["403"], "404": errors["404"], "422": errors["422"] }, { parameters: [orderIdParameter, monthParameter] }),
    },
    "/orders/{orderId}/forecast": {
      get: operation("When the budget runs out, with an optional what-if scenario", "Forecast and follow-up", "the order's project lead", { "200": ok("The forecast, or status not-enough-data"), "400": errors["400"], "401": errors["401"], "403": errors["403"], "404": errors["404"] }, {
        parameters: [
          orderIdParameter,
          { name: "extraConsultants", in: "query", schema: { type: "integer", minimum: 1, maximum: 20 } },
          { name: "extraFromDate", in: "query", schema: { type: "string", format: "date" } },
          { name: "projectEndShiftWeeks", in: "query", schema: { type: "integer", minimum: 1, maximum: 52 } },
        ],
      }),
    },
    "/orders/{orderId}/follow-up-requests": {
      post: operation("Ask purchasing for more budget", "Forecast and follow-up", "the order's project lead", { "201": ok("The request"), "400": errors["400"], "401": errors["401"], "403": errors["403"], "404": errors["404"], "422": errors["422"] }, {
        parameters: [orderIdParameter],
        requestBody: body({ type: "object", required: ["personDays", "neededByDate"], properties: { personDays: { type: "number" }, neededByDate: { type: "string", format: "date" } } }),
      }),
    },
    "/purchasing/supplier-overview": {
      get: operation("Totals per supplier and order, with no personal data", "Purchasing", "purchasing", { "200": ok("The totals"), "401": errors["401"], "403": errors["403"] }),
    },
    "/purchasing/invoice-check": {
      post: operation("Compare an invoice with an approved month", "Purchasing", "purchasing", { "200": ok("The result"), "400": errors["400"], "401": errors["401"], "403": errors["403"], "404": errors["404"], "422": errors["422"] }, {
        requestBody: body({ type: "object", required: ["orderId", "month", "invoicedPersonDays"], properties: { orderId: { type: "string" }, month: { type: "string", example: "2026-10" }, invoicedPersonDays: { type: "number" } } }),
      }),
    },
    "/purchasing/follow-up-requests": {
      get: operation("Project leads' requests for more budget", "Purchasing", "purchasing", { "200": ok("The requests"), "401": errors["401"], "403": errors["403"] }),
    },
    "/purchasing/follow-up-requests/{id}/confirm": {
      post: operation("Confirm a request, which raises the order's budget. Rejected when its framework agreement has too little free", "Purchasing", "purchasing", { "200": ok("The requests"), "400": errors["400"], "401": errors["401"], "403": errors["403"], "404": errors["404"], "422": errors["422"] }, {
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
      }),
    },
    "/purchasing/follow-up-requests/{id}/decline": {
      post: operation("Decline a request, which leaves the budget as it is", "Purchasing", "purchasing", { "200": ok("The requests"), "400": errors["400"], "401": errors["401"], "403": errors["403"], "404": errors["404"], "422": errors["422"] }, {
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
      }),
    },
    "/purchasing/framework-agreements": {
      get: operation("Framework agreements with the orders sharing each one, with no personal data", "Purchasing", "purchasing", { "200": ok("The agreements"), "401": errors["401"], "403": errors["403"] }),
    },
    "/activity": {
      get: operation("Recent activity, scoped by role", "Activity", "every role. Purchasing gets no single bookings and no other person's name", { "200": ok("The entries"), "401": errors["401"] }),
    },
    "/integrations/time-tracking/bookings": {
      post: {
        summary: "Send a batch from a supplier's own time tracking",
        tags: ["Interface"],
        description: "Needs a supplier key. All rows or none are stored, each passes the same rules as a booking by hand, and a duplicate is rejected. A rejection names the row.",
        security: supplierKey,
        requestBody: body({
          type: "object",
          required: ["bookings"],
          properties: { bookings: { type: "array", minItems: 1, maxItems: 500, items: { allOf: [ref("NewBooking"), { type: "object", required: ["consultantId"], properties: { consultantId: { type: "string" } } }] } } },
        }),
        responses: { "201": ok("How many were stored"), "400": errors["400"], "401": { description: "No valid supplier key" }, "422": errors["422"] },
      },
    },
  },
  components: {
    securitySchemes: {
      session: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      supplierKey: { type: "apiKey", in: "header", name: "X-Api-Key" },
    },
    schemas: {
      User: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          email: { type: "string" },
          role: { enum: ["consultant", "project_lead", "purchasing"] },
          consultantId: { type: ["string", "null"] },
        },
      },
      NewBooking: {
        type: "object",
        required: ["orderId", "date", "startTime", "endTime", "hours", "description"],
        properties: {
          orderId: { type: "string", example: "4500012345" },
          date: { type: "string", format: "date" },
          startTime: { type: "string", example: "09:00" },
          endTime: { type: "string", example: "17:00" },
          hours: { type: "number", example: 7, description: "Worked hours: start to end, without breaks" },
          description: { type: "string", example: "Customer portal development" },
        },
      },
      RuleError: {
        type: "object",
        properties: {
          error: { type: "string", example: "Booking rejected: outside the order period." },
          rule: { type: "string", example: "order-period" },
          values: { type: "object" },
        },
      },
    },
  },
};
