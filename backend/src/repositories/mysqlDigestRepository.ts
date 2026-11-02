// MySQL implementation of DigestRepository. Database column names stay inside this file.
import type { Pool, RowDataPacket } from "mysql2/promise";
import type { User, UserRole } from "../domain/user.ts";
import type { DigestRepository } from "./digestRepository.ts";

type SubscriberRow = RowDataPacket & { id: string; name: string; email: string; role: UserRole; consultant_id: string | null };

export function createMysqlDigestRepository(db: Pool): DigestRepository {
  return {
    isSubscribed: async (userId) => {
      const [rows] = await db.query<RowDataPacket[]>("SELECT 1 FROM digest_subscriptions WHERE user_id = ?", [userId]);
      return rows.length > 0;
    },
    // Turning it on twice keeps the first date, which is when the person agreed.
    subscribe: async (userId, subscribedAtMs) => {
      await db.query("INSERT IGNORE INTO digest_subscriptions (user_id, subscribed_at_ms) VALUES (?, ?)", [userId, subscribedAtMs]);
    },
    unsubscribe: async (userId) => {
      await db.query("DELETE FROM digest_subscriptions WHERE user_id = ?", [userId]);
    },
    listSubscribedProjectLeads: async (): Promise<User[]> => {
      const [rows] = await db.query<SubscriberRow[]>(
        `SELECT users.id, users.name, users.email, users.role, users.consultant_id FROM digest_subscriptions
         JOIN users ON users.id = digest_subscriptions.user_id
         WHERE users.role = 'project_lead' ORDER BY users.id`,
      );
      return rows.map((row) => ({ id: row.id, name: row.name, email: row.email, role: row.role, consultantId: row.consultant_id }));
    },
    wasDelivered: async (userId, orderId, isoWeek) => {
      const [rows] = await db.query<RowDataPacket[]>(
        "SELECT 1 FROM digest_deliveries WHERE user_id = ? AND order_id = ? AND iso_week = ?",
        [userId, orderId, isoWeek],
      );
      return rows.length > 0;
    },
    recordDelivery: async (userId, orderId, isoWeek, sentAtMs) => {
      await db.query("INSERT IGNORE INTO digest_deliveries (user_id, order_id, iso_week, sent_at_ms) VALUES (?, ?, ?, ?)", [userId, orderId, isoWeek, sentAtMs]);
    },
  };
}
