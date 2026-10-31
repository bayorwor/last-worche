// Runs against a real MySQL database, and only when TEST_DATABASE_URL is set. Deletes all bookings and activity there.
import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import type { Pool } from "mysql2/promise";
import { BusinessRuleError } from "../domain/errors.ts";
import type { User } from "../domain/user.ts";
import { createActivityService, type ActivityService } from "../services/activityService.ts";
import { createBookingService } from "../services/bookingService.ts";
import { createProofOfWorkService } from "../services/proofOfWorkService.ts";
import { openDatabase } from "./database.ts";
import { createMysqlActivityRepository } from "./mysqlActivityRepository.ts";
import { createMysqlBookingRepository } from "./mysqlBookingRepository.ts";
import { DEMO_CONSULTANT_ID, DEMO_PROJECT_LEAD_ID, SEED_ORDER_ID } from "./seedData.ts";

const databaseUrl = process.env.TEST_DATABASE_URL;

const baseUser = { name: "", email: "x@test.example", consultantId: null };
const consultant: User = { ...baseUser, id: "user-consultant", role: "consultant", consultantId: DEMO_CONSULTANT_ID };
const lead: User = { ...baseUser, id: DEMO_PROJECT_LEAD_ID, role: "project_lead" };
const otherLead: User = { ...baseUser, id: "user-project-lead-2", role: "project_lead" };
const purchasing: User = { ...baseUser, id: "user-purchasing", role: "purchasing" };

const booking = {
  orderId: SEED_ORDER_ID,
  consultantId: DEMO_CONSULTANT_ID,
  date: "2026-10-27",
  startTime: "09:00",
  endTime: "17:00",
  hours: 7,
  description: "Work",
};

describe.skipIf(!databaseUrl)("mysqlActivityRepository", () => {
  let db: Pool;
  let activity: ActivityService;

  beforeAll(async () => {
    db = await openDatabase(databaseUrl as string);
    activity = createActivityService(createMysqlActivityRepository(db));
  });

  beforeEach(async () => {
    await db.query("DELETE FROM activity_log");
    await db.query("DELETE FROM proofs_of_work");
    await db.query("DELETE FROM bookings");
  });

  afterAll(async () => {
    await db.end();
  });

  test("a saved booking reaches its consultant and the order's lead, but not another lead or purchasing", async () => {
    await createBookingService(createMysqlBookingRepository(db)).createBooking(booking);

    expect(await activity.listFor(consultant)).toMatchObject([{ type: "booking_created", isOwn: true, period: "2026-10-27", hours: 7 }]);
    expect(await activity.listFor(lead)).toMatchObject([{ type: "booking_created", isOwn: false, actorName: "L. Hoffmann" }]);
    expect(await activity.listFor(otherLead)).toEqual([]);
    expect(await activity.listFor(purchasing)).toEqual([]);
  });

  test("a rejected booking leaves no entry", async () => {
    await expect(createBookingService(createMysqlBookingRepository(db)).createBooking({ ...booking, hours: 2000 })).rejects.toThrow(BusinessRuleError);

    expect(await activity.listFor(consultant)).toEqual([]);
  });

  test("purchasing sees an approved month with no name, and the consultant does not see it", async () => {
    await createBookingService(createMysqlBookingRepository(db)).createBooking(booking);
    await createProofOfWorkService(createMysqlBookingRepository(db)).approveFor(lead, SEED_ORDER_ID, "2026-10");

    expect(await activity.listFor(purchasing)).toMatchObject([{ type: "proof_approved", isOwn: false, actorName: null, period: "2026-10" }]);
    expect((await activity.listFor(consultant)).map((entry) => entry.type)).toEqual(["booking_created"]);
  });
});
