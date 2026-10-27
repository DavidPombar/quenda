// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsUUID } from "class-validator";
import {
  CATEGORIES,
  type Category,
} from "../../../../../shared/application/categories";
export class CitizenCategoryPathRequestDTO {
  @ApiProperty({ description: "Citizen UUID" })
  @IsUUID()
  userId!: string;
  @ApiProperty({ enum: CATEGORIES, description: "User category" })
  @IsIn(CATEGORIES)
  category!: Category;
}
