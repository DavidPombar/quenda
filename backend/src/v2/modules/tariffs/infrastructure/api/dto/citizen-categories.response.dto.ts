// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { CitizenCategories } from "../../../domain/user-category.entity";
import { UserCategoryResponseDTO } from "./user-category.response.dto";
export class CitizenCategoriesResponseDTO {
  @ApiProperty({ description: "Citizen UUID" }) userId!: string;
  @ApiProperty({ description: "Citizen display name" }) displayName!: string;
  @ApiProperty({ type: [UserCategoryResponseDTO] })
  categories!: UserCategoryResponseDTO[];
  static from(value: CitizenCategories): CitizenCategoriesResponseDTO {
    return {
      userId: value.userId,
      displayName: value.displayName,
      categories: value.categories.map(UserCategoryResponseDTO.from),
    };
  }
}
