// The weekly email digest (issue #64). A project lead turns it on for themselves; the job then sends one email
// per order they lead that had bookings last week. Nobody is subscribed unless they chose it.
import { calculateBudget } from "../domain/booking.ts";
import { ForbiddenError } from "../domain/errors.ts";
import type { User } from "../domain/user.ts";
import { buildOrderDigest, isoWeekLabel, needsDigest, type DigestForecast } from "../domain/weeklyDigest.ts";
import type { BookingRepository } from "../repositories/bookingRepository.ts";
import type { DigestRepository } from "../repositories/digestRepository.ts";
import { buildWeeklyDigestEmail } from "../templates/weeklyDigestEmail.ts";
import type { Email } from "./emailService.ts";
import type { ForecastService } from "./forecastService.ts";

export type DigestService = ReturnType<typeof createDigestService>;

type DigestDependencies = {
  digests: DigestRepository;
  bookings: BookingRepository;
  forecasts: ForecastService;
  sendEmail: (email: Email) => Promise<void>;
  now?: () => number;
};

export type DigestRunResult = { sent: number; alreadySent: number; failed: number };

export function createDigestService({ digests, bookings, forecasts, sendEmail, now = Date.now }: DigestDependencies) {
  function assertProjectLead(user: User) {
    if (user.role !== "project_lead") throw new ForbiddenError("Only a project lead can receive the weekly digest.");
  }

  // The forecast service checks again that this lead leads the order, so the digest can never show more than the app.
  async function buildEmail(lead: User, orderId: string, today: string) {
    const order = await bookings.findOrder(orderId);
    if (!order) return null;
    const bookedDays = await bookings.listBookedDays(orderId);
    if (!needsDigest(bookedDays, today)) return null;

    const forecast = await forecasts.getForecastFor(lead, orderId, {});
    const digestForecast: DigestForecast =
      forecast.status === "ok"
        ? { status: "ok", exhaustionWeek: forecast.base.exhaustionWeek, warning: forecast.base.warning }
        : { status: "not-enough-data" };
    const title = (await bookings.listOrdersLedBy(lead.id)).find(({ id }) => id === orderId)?.title ?? orderId;
    const digest = buildOrderDigest({
      today,
      order: { id: orderId, title },
      budget: calculateBudget(order, await bookings.sumBookedHours(orderId)),
      bookedDays,
      forecast: digestForecast,
      openFollowUp: forecast.openFollowUp,
    });
    return buildWeeklyDigestEmail(digest, lead.name);
  }

  return {
    async getSubscriptionFor(user: User) {
      assertProjectLead(user);
      return { subscribed: await digests.isSubscribed(user.id) };
    },

    // The user comes from the session, so nobody can subscribe someone else.
    async setSubscriptionFor(user: User, subscribed: boolean) {
      assertProjectLead(user);
      if (subscribed) await digests.subscribe(user.id, now());
      else await digests.unsubscribe(user.id);
      return { subscribed };
    },

    // Run once a week by `bun run digest`. A failed email is not noted as sent, so the next run tries it again.
    async sendWeeklyDigests(): Promise<DigestRunResult> {
      const today = new Date(now()).toISOString().slice(0, 10);
      const isoWeek = isoWeekLabel(today);
      const result: DigestRunResult = { sent: 0, alreadySent: 0, failed: 0 };

      for (const lead of await digests.listSubscribedProjectLeads()) {
        for (const { id: orderId } of await bookings.listOrdersLedBy(lead.id)) {
          if (await digests.wasDelivered(lead.id, orderId, isoWeek)) {
            result.alreadySent += 1;
            continue;
          }
          const email = await buildEmail(lead, orderId, today);
          if (!email) continue;
          try {
            await sendEmail({ to: lead.email, ...email });
            await digests.recordDelivery(lead.id, orderId, isoWeek, now());
            result.sent += 1;
          } catch (error) {
            console.error(`Sending the weekly digest for order ${orderId} failed:`, error);
            result.failed += 1;
          }
        }
      }
      return result;
    },
  };
}
