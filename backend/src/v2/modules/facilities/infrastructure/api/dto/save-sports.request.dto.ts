// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from "class-validator";
import { SPORT_ARTS } from "./sport.response.dto";

export class SportDraftRequestDTO {
  @ApiProperty({
    description: "Stable code; lowercase letters, digits and dashes",
  })
  @Matches(/^[a-z0-9-]{2,40}$/)
  code!: string;
  @ApiProperty({ description: "Name in Galician" })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  nameGl!: string;
  @ApiProperty({ description: "Name in Spanish" })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  nameEs!: string;
  @ApiProperty({ description: "CNID group of conventional sports spaces" })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  cnidClass!: string;
  @ApiProperty({ description: "CNID sports space type" })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  cnidType!: string;
  @ApiProperty({ description: "schema.org type, e.g. SportsActivityLocation" })
  @Matches(/^[A-Z][A-Za-z]+$/)
  schemaType!: string;
  @ApiProperty({ enum: SPORT_ARTS, description: "Illustration and colour" })
  @IsIn(SPORT_ARTS)
  art!: "padel" | "tennis" | "futsal" | "swimming" | "generic";
  @ApiProperty({ description: "Offered for new facilities and as a filter" })
  @IsBoolean()
  visible!: boolean;
}
export class SaveSportsRequestDTO {
  @ApiProperty({
    description:
      "Complete catalogue in display order; sports left out are removed",
    type: [SportDraftRequestDTO],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => SportDraftRequestDTO)
  sports!: SportDraftRequestDTO[];
}
