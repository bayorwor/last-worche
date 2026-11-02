// Runs against a real MySQL database, and only when TEST_DATABASE_URL is set.
import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import type { Pool, RowDataPacket } from "mysql2/promise";
import { BusinessRuleError } from "../domain/errors.ts";
import type { User } from "../domain/user.ts";
import { createFollowUpService, type FollowUpService } from "../services/followUpService.ts";
import { createPurchasingService, type PurchasingService } from "../services/purchasingService.ts";
import { openDatabase } from "./database.ts";
import { createMysqlBookingRepository } from "./mysqlBookingRepository.ts";
import { DEMO_PROJECT_LEAD_ID, NEAR_LIMIT_ORDER_ID, SECOND_LEAD_ORDER_ID, SEED_ORDER_ID } from "./seedData.ts";

const databaseUrl = process.env.TEST_DATABASE_URL;
const lead: User = { id: DEMO_PROJECT_LEAD_ID, name: "A. Weber", email: "a@test.example", role: "project_lead", consultantId: null };
const otherLead: User = { ...lead, id: "user-project-lead-2" };
const buyer: User = { ...lead, id: "user-purchasing", role: "purchasing" };

describe.skipIf(!databaseUrl)("framework agreements against real MySQL", () => {
  let db: Pool;
  let followUps: FollowUpService;

  async function budgets() {
    const [rows] = await db.query<RowDataPacket[]>("SELECT SUM(ordered_person_days) AS total FROM orders WHERE id IN (?)", [[NEAR_LIMIT_ORDER_ID, SECOND_LEAD_ORDER_ID]]);
    return rows[0]?.total;
  }

  async function resetOrders() {
    await db.query("DELETE FROM follow_up_requests");
    await db.query("UPDATE orders SET ordered_person_days = 20 WHERE id = ?", [NEAR_LIMIT_ORDER_ID]);
    await db.query("UPDATE orders SET ordered_person_days = 30 WHERE id = ?", [SECOND_LEAD_ORDER_ID]);
  }

  beforeAll(async () => {
    db = await openDatabase(databaseUrl as string);
    followUps = createFollowUpService(createMysqlBookingRepository(db));
  });

  beforeEach(resetOrders);

  afterAll(async () => {
    await resetOrders();
    await db.end();
  });

  test("the seeded agreement shows the two orders that share it, with no person", async () => {
    const agreements = await createPurchasingService(createMysqlBookingRepository(db)).listFrameworkAgreements();
    const shared = agreements.find(({ id }) => id === "RV-2026-002");

    expect(shared).toMatchObject({ supplierName: "Nordlicht Agentur", totalPersonDays: 60, orderedPersonDays: 50, freePersonDays: 10 });
    expect(shared?.orders.map(({ orderId }) => orderId)).toEqual([NEAR_LIMIT_ORDER_ID, SECOND_LEAD_ORDER_ID]);
    expect(JSON.stringify(agreements)).not.toMatch(/Hoffmann|Krüger|Tanriver/);
  });

  test("confirming more than is free is rejected, and declining then works", async () => {
    const { id } = await followUps.request(lead, NEAR_LIMIT_ORDER_ID, 15, "2026-12-01");

    await expect(followUps.confirm(buyer, id)).rejects.toThrow("only 10 PD free");
    expect(await budgets()).toBe(50);

    await followUps.decline(buyer, id);
    expect(await followUps.listAll()).toMatchObject([{ id, status: "declined" }]);
  });

  test("confirmations at the same moment on two orders cannot exceed the agreement together", async () => {
    const first = await followUps.request(lead, NEAR_LIMIT_ORDER_ID, 6, "2026-12-01");
    const second = await followUps.request(otherLead, SECOND_LEAD_ORDER_ID, 6, "2026-12-01");

    const results = await Promise.allSettled([followUps.confirm(buyer, first.id), followUps.confirm(buyer, second.id)]);

    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(await budgets()).toBe(56);
  });
});

describe.skipIf(!databaseUrl)("stored invoices against real MySQL", () => {
  const month = "2026-08";
  const invoice = { orderId: SEED_ORDER_ID, month, invoiceNumber: "RE-1001", invoicedPersonDays: 5 };
  let db: Pool;
  let purchasing: PurchasingService;

  beforeAll(async () => {
    db = await openDatabase(databaseUrl as string);
    purchasing = createPurchasingService(createMysqlBookingRepository(db));
  });

  async function clear() {
    await db.query("DELETE FROM invoices");
    await db.query("DELETE FROM proofs_of_work");
    await db.query("DELETE FROM bookings");
  }

  beforeEach(async () => {
    await clear();
    await db.query(
      "INSERT INTO bookings (order_id, consultant_id, date, start_time, end_time, hours, description) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [SEED_ORDER_ID, "consultant-1", `${month}-17`, "09:00", "17:00", 8, "Work"],
    );
    await db.query("INSERT INTO proofs_of_work (order_id, month, approved_by_user_id, approved_at_ms) VALUES (?, ?, ?, ?)", [SEED_ORDER_ID, month, DEMO_PROJECT_LEAD_ID, 1000]);
  });

  afterAll(async () => {
    await clear();
    await db.end();
  });

  test("stores an invoice and lists it with its difference and the order's title", async () => {
    await purchasing.recordInvoice(buyer, invoice);

    expect(await purchasing.listInvoices()).toMatchObject([
      { orderId: SEED_ORDER_ID, orderTitle: "Customer portal migration", month, invoiceNumber: "RE-1001", status: "over-approved", differencePersonDays: 4 },
    ]);
  });

  test("two saves of one month at the same moment store only one, with the rule's error", async () => {
    const results = await Promise.allSettled([purchasing.recordInvoice(buyer, invoice), purchasing.recordInvoice(buyer, { ...invoice, invoiceNumber: "RE-1002" })]);

    const rejected = results.filter((result) => result.status === "rejected") as PromiseRejectedResult[];
    expect(rejected).toHaveLength(1);
    expect(rejected[0]?.reason).toBeInstanceOf(BusinessRuleError);
    expect(await purchasing.listInvoices()).toHaveLength(1);
  });
});
