// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { ExportedCategory } from "../../../domain/account.read-model";
import {
  CATEGORIES,
  type Category,
} from "../../../../../shared/application/categories";
export class ExportedCategoryResponseDTO {
  @ApiProperty({ enum: CATEGORIES, description: "User category" })
  category!: Category;
  @ApiProperty({ enum: ["requested", "verified", "rejected"] })
  status!: ExportedCategory["status"];
  @ApiProperty({ type: String, nullable: true, description: "Request instant" })
  requestedAt!: string | null;
  @ApiProperty({
    type: String,
    nullable: true,
    description: "Decision instant",
  })
  decidedAt!: string | null;
  static from(value: ExportedCategory): ExportedCategoryResponseDTO {
    return {
      category: value.category,
      status: value.status,
      requestedAt: value.requestedAt?.toString() ?? null,
      decidedAt: value.decidedAt?.toString() ?? null,
    };
  }
}
