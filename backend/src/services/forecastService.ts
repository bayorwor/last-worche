// Gathers what a forecast needs, and hands it to the domain. Only the project lead of an order may see it,
// because it is built from single consultants' bookings and vacations.
import { ForbiddenError, NotFoundError } from "../domain/errors.ts";
import {
  calculateForecast,
  calculatePaces,
  describeAssumptions,
  hasEnoughDataForForecast,
  withScenario,
  type ForecastInput,
  type ForecastScenario,
} from "../domain/forecast.ts";
import { calculateBudget } from "../domain/booking.ts";
import type { User } from "../domain/user.ts";
import type { BookingRepository } from "../repositories/bookingRepository.ts";

export type ForecastService = ReturnType<typeof createForecastService>;

export function createForecastService(repository: BookingRepository, now: () => number = Date.now) {
  async function buildInput(orderId: string, orderedPersonDays: number, today: string): Promise<ForecastInput | null> {
    const bookedDays = await repository.listBookedDays(orderId);
    if (!hasEnoughDataForForecast(bookedDays, today)) return null;

    const paces = calculatePaces(bookedDays, today);
    const calendars = await repository.findConsultantCalendars(paces.map(({ consultantId }) => consultantId));
    return {
      today,
      orderedPersonDays,
      bookedHours: await repository.sumBookedHours(orderId),
      projectEndDate: (await repository.findProjectEndDate(orderId)) as string,
      consultants: paces.map((pace) => ({ ...pace, federalState: null, vacations: [], ...calendars[pace.consultantId] })),
      shutdowns: await repository.listShutdowns(),
    };
  }

  function buildResult(input: ForecastInput) {
    const forecast = calculateForecast(input);
    const lastDay = [forecast.exhaustionDate, forecast.projectEndDate].filter((date) => date !== null).sort().at(-1) as string;
    return { ...forecast, assumptions: describeAssumptions(input, lastDay) };
  }

  return {
    async getForecastFor(user: User, orderId: string, scenario: ForecastScenario) {
      const order = await repository.findOrder(orderId);
      if (!order) throw new NotFoundError(`Order ${orderId} does not exist.`);
      if (user.role !== "project_lead" || !(await repository.isOrderLedBy(user.id, orderId))) {
        throw new ForbiddenError(`You may not see the forecast of order ${orderId}.`);
      }

      const today = new Date(now()).toISOString().slice(0, 10);
      const { freePersonDays } = calculateBudget(order, await repository.sumBookedHours(orderId));
      const openFollowUp = await repository.findOpenFollowUpOfOrder(orderId);
      const input = await buildInput(orderId, order.orderedPersonDays, today);
      if (!input) return { status: "not-enough-data" as const, freePersonDays, openFollowUp };

      const hasScenario = Object.values(scenario).some((value) => value !== undefined);
      return {
        status: "ok" as const,
        freePersonDays,
        openFollowUp,
        base: buildResult(input),
        scenario: hasScenario ? buildResult(withScenario(input, scenario)) : null,
      };
    },
  };
}
