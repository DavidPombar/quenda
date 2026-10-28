// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { IsIn } from "class-validator";
import {
  CATEGORIES,
  type Category,
} from "../../../../../shared/application/categories";
export class RequestCategoryRequestDTO {
  @ApiProperty({ enum: CATEGORIES, description: "Category to verify" })
  @IsIn(CATEGORIES)
  category!: Category;
}
