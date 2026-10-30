// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
} from "class-validator";
export class SlotSuggestionsRequestDTO {
  @ApiProperty({ description: "Municipality slug" })
  @IsString()
  @Matches(/^[a-z0-9-]{1,64}$/)
  slug!: string;
  @ApiProperty({ description: "Facility the person was looking at" })
  @IsUUID()
  facilityId!: string;
  @ApiProperty({ description: "Local date in the municipality's time zone" })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date!: string;
  @ApiPropertyOptional({
    description:
      "Start the person wanted (ISO instant); ties go to the closest",
  })
  @IsOptional()
  @IsISO8601({ strict: true })
  around?: string;
}
