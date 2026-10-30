// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  ValidateNested,
} from "class-validator";
export class CriteriaRequestDTO {
  @ApiProperty({ description: "Published priority criteria in Galician" })
  @IsString()
  @MaxLength(4000)
  gl!: string;
  @ApiProperty({ description: "Published priority criteria in Spanish" })
  @IsString()
  @MaxLength(4000)
  es!: string;
}
export class CampaignRequestDTO {
  @ApiProperty() @IsString() @MaxLength(120) name!: string;
  @ApiProperty({ description: "First day (YYYY-MM-DD)" })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  startsOn!: string;
  @ApiProperty({ description: "Last day, inclusive (YYYY-MM-DD)" })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  endsOn!: string;
  @ApiProperty({ type: CriteriaRequestDTO })
  @ValidateNested()
  @Type(() => CriteriaRequestDTO)
  criteria!: CriteriaRequestDTO;
  @ApiProperty({
    type: [String],
    description: "Facilities the campaign covers",
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @IsUUID("all", { each: true })
  facilityIds!: string[];
}
