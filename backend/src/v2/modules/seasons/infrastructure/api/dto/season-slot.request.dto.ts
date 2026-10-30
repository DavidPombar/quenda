// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
} from "class-validator";
export class SeasonSlotRequestDTO {
  @ApiProperty() @IsUUID() campaignId!: string;
  @ApiProperty() @IsUUID() organizationId!: string;
  @ApiProperty() @IsUUID() facilityId!: string;
  @ApiProperty({
    description: "Court or space (a whole court occupies its parts)",
  })
  @IsUUID()
  resourceId!: string;
  @ApiProperty({ type: [Number], description: "ISO weekdays, 1 = Monday" })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(7)
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Max(7, { each: true })
  weekdays!: number[];
  @ApiProperty({ description: "Local start time (HH:MM)" })
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  startsLocal!: string;
  @ApiProperty({ description: "Local end time (HH:MM)" })
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  endsLocal!: string;
  @ApiProperty({ description: "Why the club gets the slot (journal)" })
  @IsString()
  @MaxLength(500)
  reason!: string;
}
