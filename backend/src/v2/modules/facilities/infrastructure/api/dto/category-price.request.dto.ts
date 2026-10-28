// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsInt, Max, Min } from "class-validator";
import {
  CATEGORIES,
  type Category,
} from "../../../../../shared/application/categories";
export class CategoryPriceRequestDTO {
  @ApiProperty({ enum: CATEGORIES, description: "User category" })
  @IsIn(CATEGORIES)
  category!: Category;
  @ApiProperty({
    description: "Indicative price in EUR cents for this category",
  })
  @IsInt()
  @Min(0)
  @Max(100000)
  priceCents!: number;
}
