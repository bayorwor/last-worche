// MySQL implementation of ActivityRepository. Database column names stay inside this file.
import type { Pool, PoolConnection, RowDataPacket } from "mysql2/promise";
import type { Activity, NewActivity } from "../domain/activity.ts";
import { RECENT_ACTIVITY_LIMIT, type ActivityRepository } from "./activityRepository.ts";

type ActivityRow = RowDataPacket & Activity;

// Takes a connection too, so a booking and its log entry can be saved in one transaction.
export async function insertActivity(db: Pool | PoolConnection, activity: NewActivity) {
  await db.query(
    "INSERT INTO activity_log (type, actor_user_id, occurred_at_ms, order_id, period, hours) VALUES (?, ?, ?, ?, ?, ?)",
    [activity.type, activity.actorUserId, activity.occurredAtMs, activity.orderId, activity.period, activity.hours],
  );
}

export function createMysqlActivityRepository(db: Pool): ActivityRepository {
  async function list(where: string, values: string[]) {
    const [rows] = await db.query<ActivityRow[]>(
      `SELECT activity_log.id, activity_log.type, activity_log.actor_user_id AS actorUserId, users.name AS actorName,
         activity_log.occurred_at_ms AS occurredAtMs, activity_log.order_id AS orderId, activity_log.period, activity_log.hours
       FROM activity_log
       JOIN users ON users.id = activity_log.actor_user_id
       WHERE ${where}
       ORDER BY activity_log.occurred_at_ms DESC, activity_log.id DESC LIMIT ?`,
      [...values, RECENT_ACTIVITY_LIMIT],
    );
    return rows.map((row) => ({ ...row }));
  }

  return {
    record: (activity) => insertActivity(db, activity),
    listOwn: (userId) => list("activity_log.actor_user_id = ?", [userId]),
    listForProjectLead: (userId) =>
      list("activity_log.actor_user_id = ? OR activity_log.order_id IN (SELECT id FROM orders WHERE project_lead_id = ?)", [
        userId,
        userId,
      ]),
    listForPurchasing: (userId) => list("activity_log.actor_user_id = ? OR activity_log.type IN ('proof_approved', 'follow_up_requested', 'follow_up_confirmed')", [userId]),
  };
}
