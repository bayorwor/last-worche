// The recent activity a user may see. The role decides the scope, and the session decides the user,
// so no request can ask for someone else's activity.
import { toVisibleActivity } from "../domain/activity.ts";
import type { User } from "../domain/user.ts";
import type { ActivityRepository } from "../repositories/activityRepository.ts";

export type ActivityService = ReturnType<typeof createActivityService>;

export function createActivityService(repository: ActivityRepository) {
  function listInScope(user: User) {
    if (user.role === "project_lead") return repository.listForProjectLead(user.id);
    if (user.role === "purchasing") return repository.listForPurchasing(user.id);
    return repository.listOwn(user.id);
  }

  return {
    async listFor(user: User) {
      return (await listInScope(user)).map((activity) => toVisibleActivity(activity, user));
    },
  };
}
