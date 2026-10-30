// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import type { Campaign } from "../../../domain/season.read-model";
import { CriteriaRequestDTO } from "./campaign.request.dto";
export class CampaignResponseDTO {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() startsOn!: string;
  @ApiProperty() endsOn!: string;
  @ApiProperty({ type: CriteriaRequestDTO }) criteria!: CriteriaRequestDTO;
  @ApiProperty({ type: [String] }) facilityIds!: string[];
  static from(value: Campaign): CampaignResponseDTO {
    return {
      id: value.id,
      name: value.name,
      startsOn: value.startsOn,
      endsOn: value.endsOn,
      criteria: { ...value.criteria },
      facilityIds: value.facilityIds,
    };
  }
}
