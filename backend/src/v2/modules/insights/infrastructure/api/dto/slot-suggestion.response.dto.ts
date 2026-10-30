// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { SlotSuggestion } from "../../../application/queries/suggest-slots.query";
export class SlotSuggestionResponseDTO {
  @ApiProperty() facilityId!: string;
  @ApiProperty() facilityName!: string;
  @ApiProperty() resourceId!: string;
  @ApiProperty() resourceName!: string;
  @ApiProperty({ description: "UTC instant" }) start!: string;
  @ApiProperty({ description: "UTC instant" }) end!: string;
  @ApiProperty({
    description:
      "Usual occupancy at that weekday and hour over the last 12 complete weeks; null without history",
    type: Number,
    nullable: true,
  })
  occupancyPct!: number | null;
  @ApiProperty({
    description: "Whether it is the facility the person was looking at",
  })
  sameFacility!: boolean;
  static from(value: SlotSuggestion): SlotSuggestionResponseDTO {
    return {
      facilityId: value.facilityId,
      facilityName: value.facilityName,
      resourceId: value.resourceId,
      resourceName: value.resourceName,
      start: value.start.toString(),
      end: value.end.toString(),
      occupancyPct: value.occupancyPct,
      sameFacility: value.sameFacility,
    };
  }
}
export class SlotSuggestionsResponseDTO {
  @ApiProperty({ type: [SlotSuggestionResponseDTO] })
  suggestions!: SlotSuggestionResponseDTO[];
  static from(value: SlotSuggestion[]): SlotSuggestionsResponseDTO {
    return { suggestions: value.map(SlotSuggestionResponseDTO.from) };
  }
}
