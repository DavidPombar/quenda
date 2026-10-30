// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from "class-validator";
import { SPORT_ARTS, SPORT_CODE } from "../../../domain/sport.repository";
import type { SportArt } from "../../../domain/sport.entity";
const defined = (_object: unknown, value: unknown) => value !== undefined;
export class SportNameRequestDTO {
  @ApiProperty({ description: "Galician" })
  @IsString()
  @MaxLength(60)
  gl!: string;
  @ApiProperty({ description: "Spanish" })
  @IsString()
  @MaxLength(60)
  es!: string;
}
export class UpdateSportRequestDTO {
  @ApiPropertyOptional({ type: SportNameRequestDTO })
  @ValidateIf(defined)
  @ValidateNested()
  @Type(() => SportNameRequestDTO)
  name?: SportNameRequestDTO;
  @ApiPropertyOptional({ description: "CNID group of conventional spaces" })
  @ValidateIf(defined)
  @IsString()
  @MaxLength(80)
  cnidClass?: string;
  @ApiPropertyOptional({ description: "CNID space type" })
  @ValidateIf(defined)
  @IsString()
  @MaxLength(80)
  cnidType?: string;
  @ApiPropertyOptional({ description: "schema.org type" })
  @ValidateIf(defined)
  @Matches(/^[A-Z][A-Za-z]{0,59}$/)
  schemaType?: string;
  @ApiPropertyOptional({
    enum: SPORT_ARTS,
    description: "Illustration and colour of its facilities",
  })
  @ValidateIf(defined)
  @IsIn(SPORT_ARTS)
  art?: SportArt;
  @ApiPropertyOptional({ description: "Hide from filters and new facilities" })
  @ValidateIf(defined)
  @IsBoolean()
  hidden?: boolean;
  @ApiPropertyOptional({ description: "Display order" })
  @ValidateIf(defined)
  @IsInt()
  @Min(0)
  @Max(999)
  position?: number;
}
export class CreateSportRequestDTO {
  @ApiProperty({
    description: "Stable code: lowercase letters, digits, hyphens",
  })
  @Matches(SPORT_CODE)
  code!: string;
  @ApiProperty({ type: SportNameRequestDTO })
  @ValidateNested()
  @Type(() => SportNameRequestDTO)
  name!: SportNameRequestDTO;
  @ApiPropertyOptional({ description: "CNID group of conventional spaces" })
  @ValidateIf(defined)
  @IsString()
  @MaxLength(80)
  cnidClass?: string;
  @ApiPropertyOptional({ description: "CNID space type" })
  @ValidateIf(defined)
  @IsString()
  @MaxLength(80)
  cnidType?: string;
  @ApiPropertyOptional({ description: "schema.org type" })
  @ValidateIf(defined)
  @Matches(/^[A-Z][A-Za-z]{0,59}$/)
  schemaType?: string;
  @ApiPropertyOptional({
    enum: SPORT_ARTS,
    description: "Illustration and colour of its facilities",
  })
  @ValidateIf(defined)
  @IsIn(SPORT_ARTS)
  art?: SportArt;
  @ApiPropertyOptional({ description: "Hide from filters and new facilities" })
  @ValidateIf(defined)
  @IsBoolean()
  hidden?: boolean;
  @ApiPropertyOptional({ description: "Display order" })
  @ValidateIf(defined)
  @IsInt()
  @Min(0)
  @Max(999)
  position?: number;
}
