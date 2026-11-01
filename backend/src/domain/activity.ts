// What happened in the product, shown as "recent activity". Who may see an entry depends on the role,
// and purchasing must never learn who did something on another person's behalf (roles-and-privacy.md).
import type { User } from "./user.ts";

export type ActivityType =
  | "signed_in"
  | "profile_updated"
  | "booking_created"
  | "proof_approved"
  | "follow_up_requested"
  | "follow_up_confirmed";

export type NewActivity = {
  type: ActivityType;
  actorUserId: string;
  occurredAtMs: number;
  orderId: string | null;
  period: string | null; // the booked day (YYYY-MM-DD), the approved month (YYYY-MM) or the day a follow-up is needed by
  hours: number | null; // booked hours, or the person-days of a follow-up order
};

export type Activity = NewActivity & {
  id: number;
  actorName: string;
};

// Leaves out the actor's user ID for everyone, and for purchasing also the name of anyone else.
export function toVisibleActivity(activity: Activity, viewer: User) {
  const { actorUserId, actorName, ...visible } = activity;
  const isOwn = actorUserId === viewer.id;

  return { ...visible, isOwn, actorName: isOwn || viewer.role !== "purchasing" ? actorName : null };
}
