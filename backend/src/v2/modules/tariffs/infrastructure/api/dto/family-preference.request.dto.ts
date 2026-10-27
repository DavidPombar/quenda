// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean } from "class-validator";
export class FamilyPreferenceRequestDTO {
  @ApiProperty({
    description: "Use the verified family tariff instead of the lowest one",
  })
  @IsBoolean()
  prefersFamilyTariff!: boolean;
}
