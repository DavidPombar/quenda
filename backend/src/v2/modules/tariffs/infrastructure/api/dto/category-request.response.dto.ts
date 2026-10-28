// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import {
  CATEGORIES,
  type Category,
} from "../../../../../shared/application/categories";
import { CategoryRequest } from "../../../domain/user-category.entity";
export class CategoryRequestResponseDTO {
  @ApiProperty({ description: "Citizen UUID" }) userId!: string;
  @ApiProperty({ description: "Citizen display name" }) displayName!: string;
  @ApiProperty({ enum: CATEGORIES, description: "Requested category" })
  category!: Category;
  @ApiProperty({ description: "Request instant" }) requestedAt!: string;
  static from(value: CategoryRequest): CategoryRequestResponseDTO {
    return {
      userId: value.userId,
      displayName: value.displayName,
      category: value.category,
      requestedAt: value.requestedAt.toString(),
    };
  }
}
