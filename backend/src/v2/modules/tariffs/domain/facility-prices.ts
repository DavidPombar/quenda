// SPDX-License-Identifier: AGPL-3.0-or-later
import type { CategoryPrice } from "../../../shared/application/categories";
export interface FacilityPriceList {
  priceCents: number;
  prices: CategoryPrice[];
}
/** Consumer-owned port onto the facility catalogue. */
export abstract class FacilityPrices {
  abstract find(
    tenantId: string,
    facilityId: string,
  ): Promise<FacilityPriceList | null>;
}
