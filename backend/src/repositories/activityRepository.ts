// What the activity feed needs from storage. Each list is one role's scope, newest first.
import type { Activity, NewActivity } from "../domain/activity.ts";

export const RECENT_ACTIVITY_LIMIT = 10;

export type ActivityRepository = {
  record(activity: NewActivity): Promise<void>;
  // Only what this user did themselves.
  listOwn(userId: string): Promise<Activity[]>;
  // Their own activity, and everything that happened on the orders they lead.
  listForProjectLead(userId: string): Promise<Activity[]>;
  // Their own activity, and approved months per order. Never a single booking.
  listForPurchasing(userId: string): Promise<Activity[]>;
};
