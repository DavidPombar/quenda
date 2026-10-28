// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { UserCategory } from "../../../domain/user-category.entity";
import { UserCategoryResponseDTO } from "./user-category.response.dto";
export class MyCategoriesResponseDTO {
  @ApiProperty({ type: [UserCategoryResponseDTO] })
  categories!: UserCategoryResponseDTO[];
  @ApiProperty({
    description: "Use the verified family tariff instead of the lowest one",
  })
  prefersFamilyTariff!: boolean;
  static from(value: {
    categories: UserCategory[];
    prefersFamilyTariff: boolean;
  }): MyCategoriesResponseDTO {
    return {
      categories: value.categories.map(UserCategoryResponseDTO.from),
      prefersFamilyTariff: value.prefersFamilyTariff,
    };
  }
}
