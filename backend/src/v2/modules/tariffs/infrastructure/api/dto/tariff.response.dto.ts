// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import {
  CATEGORIES,
  type TariffCategory,
} from "../../../../../shared/application/categories";
import { Tariff } from "../../../domain/resolve-tariff";
export class TariffResponseDTO {
  @ApiProperty({
    enum: [...CATEGORIES, "general"],
    description: "Category whose price applies; general when none does",
  })
  category!: TariffCategory;
  @ApiProperty({
    description: "Indicative price in EUR cents; payment is outside V1",
  })
  priceCents!: number;
  static from(value: Tariff): TariffResponseDTO {
    return { category: value.category, priceCents: value.priceCents };
  }
}
