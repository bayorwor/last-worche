// A DigestRepository that keeps data in memory, so unit tests run without a database.
import type { User } from "../domain/user.ts";
import type { DigestRepository } from "./digestRepository.ts";

export type InMemoryDigestRepository = DigestRepository & { deliveries: { userId: string; orderId: string; isoWeek: string }[] };

export function createInMemoryDigestRepository(users: User[] = []): InMemoryDigestRepository {
  const subscribedUserIds = new Set<string>();
  const deliveries: InMemoryDigestRepository["deliveries"] = [];

  return {
    deliveries,
    isSubscribed: async (userId) => subscribedUserIds.has(userId),
    subscribe: async (userId) => {
      subscribedUserIds.add(userId);
    },
    unsubscribe: async (userId) => {
      subscribedUserIds.delete(userId);
    },
    listSubscribedProjectLeads: async () => users.filter((user) => user.role === "project_lead" && subscribedUserIds.has(user.id)),
    wasDelivered: async (userId, orderId, isoWeek) =>
      deliveries.some((delivery) => delivery.userId === userId && delivery.orderId === orderId && delivery.isoWeek === isoWeek),
    recordDelivery: async (userId, orderId, isoWeek) => {
      deliveries.push({ userId, orderId, isoWeek });
    },
  };
}
