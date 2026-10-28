// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import {
  CATEGORIES,
  type Category,
  type CategoryPrice,
} from "../../../../../shared/application/categories";
export class CategoryPriceResponseDTO {
  @ApiProperty({ enum: CATEGORIES, description: "User category" })
  category!: Category;
  @ApiProperty({
    description: "Indicative price in EUR cents for this category",
  })
  priceCents!: number;
  static from(value: CategoryPrice): CategoryPriceResponseDTO {
    return { category: value.category, priceCents: value.priceCents };
  }
}
