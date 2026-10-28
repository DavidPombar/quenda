// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { FacilityPrices } from "../domain/facility-prices";
import { UserCategoryRepository } from "../domain/user-category.repository";
import { Tariff, resolveTariff } from "../domain/resolve-tariff";
import { Municipalities } from "../../../shared/application/municipality-settings";
/** Tariff a person would pay at a facility now; null when either does not exist. */
@Injectable()
export class TariffResolver {
  constructor(
    private readonly municipalities: Municipalities,
    private readonly facilities: FacilityPrices,
    private readonly categories: UserCategoryRepository,
  ) {}
  async resolve(
    tenantId: string,
    userId: string,
    facilityId: string,
  ): Promise<Tariff | null> {
    const settings = await this.municipalities.find(tenantId);
    const facility = await this.facilities.find(tenantId, facilityId);
    if (!settings || !facility) return null;
    const citizen = await this.categories.findCitizen(tenantId, userId);
    return resolveTariff({
      generalPriceCents: facility.priceCents,
      prices: facility.prices,
      enabled: settings.enabledCategories,
      verified: (citizen?.categories ?? [])
        .filter((entry) => entry.status === "verified")
        .map((entry) => entry.category),
      prefersFamily: await this.categories.prefersFamily(tenantId, userId),
    });
  }
}
