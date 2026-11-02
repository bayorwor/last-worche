// What the weekly email digest needs from storage. Services depend on this type, not on MySQL.
import type { User } from "../domain/user.ts";

export type DigestRepository = {
  isSubscribed(userId: string): Promise<boolean>;
  subscribe(userId: string, subscribedAtMs: number): Promise<void>;
  unsubscribe(userId: string): Promise<void>;
  // Only project leads, so a person whose role changed gets no digest about orders they no longer lead.
  listSubscribedProjectLeads(): Promise<User[]>;
  wasDelivered(userId: string, orderId: string, isoWeek: string): Promise<boolean>;
  recordDelivery(userId: string, orderId: string, isoWeek: string, sentAtMs: number): Promise<void>;
};
