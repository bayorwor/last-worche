// An ActivityRepository that keeps data in memory, so unit tests run without a database.
import type { Activity, NewActivity } from "../domain/activity.ts";
import type { User } from "../domain/user.ts";
import { RECENT_ACTIVITY_LIMIT, type ActivityRepository } from "./activityRepository.ts";

type LedOrder = { id: string; projectLeadId?: string };

export type InMemoryActivityRepository = ActivityRepository & {
  findUserIdOfConsultant(consultantId: string): string | null;
};

export function createInMemoryActivityRepository(users: User[] = [], orders: LedOrder[] = []): InMemoryActivityRepository {
  const entries: Activity[] = [];

  function newestFirst(matches: (entry: Activity) => boolean) {
    return entries
      .filter(matches)
      .sort((first, second) => second.occurredAtMs - first.occurredAtMs || second.id - first.id)
      .slice(0, RECENT_ACTIVITY_LIMIT);
  }

  return {
    record: async (activity: NewActivity) => {
      const actorName = users.find((user) => user.id === activity.actorUserId)?.name ?? activity.actorUserId;
      entries.push({ ...activity, id: entries.length + 1, actorName });
    },
    listOwn: async (userId) => newestFirst((entry) => entry.actorUserId === userId),
    listForProjectLead: async (userId) =>
      newestFirst(
        (entry) =>
          entry.actorUserId === userId || orders.some((order) => order.id === entry.orderId && order.projectLeadId === userId),
      ),
    listForPurchasing: async (userId) =>
      newestFirst((entry) => entry.actorUserId === userId || ["proof_approved", "follow_up_requested", "follow_up_confirmed"].includes(entry.type)),
    findUserIdOfConsultant: (consultantId) => users.find((user) => user.consultantId === consultantId)?.id ?? null,
  };
}
