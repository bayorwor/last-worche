import { describe, expect, test } from "bun:test";
import { toVisibleActivity, type Activity } from "./activity.ts";
import type { User } from "./user.ts";

const lead: User = { id: "lead-1", name: "A. Weber", email: "a@test.example", role: "project_lead", consultantId: null };
const purchasing: User = { id: "buyer-1", name: "K. Vogel", email: "k@test.example", role: "purchasing", consultantId: null };

const approval: Activity = {
  id: 1,
  type: "proof_approved",
  actorUserId: lead.id,
  actorName: lead.name,
  occurredAtMs: 1000,
  orderId: "4500012345",
  period: "2026-10",
  hours: null,
};

describe("toVisibleActivity", () => {
  test("shows a project lead the name of the person who did it", () => {
    expect(toVisibleActivity(approval, lead)).toMatchObject({ isOwn: true, actorName: "A. Weber" });
  });

  test("hides another person's name from purchasing", () => {
    expect(toVisibleActivity(approval, purchasing)).toMatchObject({ isOwn: false, actorName: null });
  });

  test("shows purchasing their own name", () => {
    const ownEntry = { ...approval, type: "signed_in" as const, actorUserId: purchasing.id, actorName: purchasing.name };

    expect(toVisibleActivity(ownEntry, purchasing)).toMatchObject({ isOwn: true, actorName: "K. Vogel" });
  });

  test("never returns the actor's user ID", () => {
    expect(toVisibleActivity(approval, lead)).not.toHaveProperty("actorUserId");
  });
});
