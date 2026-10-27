// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import {
  CATEGORIES,
  type Category,
} from "../../../../../shared/application/categories";
import { UserCategory } from "../../../domain/user-category.entity";
export class UserCategoryResponseDTO {
  @ApiProperty({ enum: CATEGORIES, description: "User category" })
  category!: Category;
  @ApiProperty({
    enum: ["requested", "verified", "rejected"],
    description: "Only verified categories change the tariff",
  })
  status!: UserCategory["status"];
  @ApiProperty({
    type: String,
    nullable: true,
    description: "Request instant; null when a manager assigned it directly",
  })
  requestedAt!: string | null;
  @ApiProperty({
    type: String,
    nullable: true,
    description: "Decision instant",
  })
  decidedAt!: string | null;
  static from(value: UserCategory): UserCategoryResponseDTO {
    return {
      category: value.category,
      status: value.status,
      requestedAt: value.requestedAt?.toString() ?? null,
      decidedAt: value.decidedAt?.toString() ?? null,
    };
  }
}
