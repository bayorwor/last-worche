// The radar for unusual booking patterns (issue #66). The project lead of an order sees each flag with the
// consultant and the days; purchasing gets only counts per supplier, worked out here so no detail leaves the server.
import { countFlagsPerSupplier, findUnusualPatterns } from "../domain/bookingRadar.ts";
import { ForbiddenError, NotFoundError } from "../domain/errors.ts";
import type { User } from "../domain/user.ts";
import type { BookingRepository } from "../repositories/bookingRepository.ts";

export type RadarService = ReturnType<typeof createRadarService>;

export function createRadarService(repository: BookingRepository, now: () => number = Date.now) {
  const today = () => new Date(now()).toISOString().slice(0, 10);

  async function flagsOf(orderId: string, orderedPersonDays: number, evaluatedOn: string) {
    return findUnusualPatterns({ today: evaluatedOn, orderedPersonDays, bookings: await repository.listRadarBookings(orderId) });
  }

  return {
    async getOrderRadarFor(user: User, orderId: string) {
      const order = await repository.findOrder(orderId);
      if (!order) throw new NotFoundError(`Order ${orderId} does not exist.`);
      if (user.role !== "project_lead" || !(await repository.isOrderLedBy(user.id, orderId))) {
        throw new ForbiddenError(`You may not see the radar of order ${orderId}.`);
      }

      const evaluatedOn = today();
      return { evaluatedOn, flags: await flagsOf(orderId, order.orderedPersonDays, evaluatedOn) };
    },

    async getSupplierRadar() {
      const evaluatedOn = today();
      const orders = await repository.listOrderTotals();
      const suppliers = await Promise.all(
        orders.map(async (order) => ({ supplierName: order.supplierName, flags: await flagsOf(order.orderId, order.orderedPersonDays, evaluatedOn) })),
      );
      return { evaluatedOn, suppliers: countFlagsPerSupplier(suppliers) };
    },
  };
}
