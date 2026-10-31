// The overview for purchasing. It reads only totals per order, so it cannot leak a single booking.
import { summariseSuppliers } from "../domain/purchasing.ts";
import type { BookingRepository } from "../repositories/bookingRepository.ts";

export type PurchasingService = ReturnType<typeof createPurchasingService>;

export function createPurchasingService(repository: BookingRepository) {
  return {
    async getSupplierOverview() {
      return summariseSuppliers(await repository.listOrderTotals());
    },
  };
}
