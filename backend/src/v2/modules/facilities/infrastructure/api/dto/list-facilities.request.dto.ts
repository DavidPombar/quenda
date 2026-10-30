// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsIn,
  IsInt,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from "class-validator";
import { SPORT_CODE } from "../../../domain/sport.repository";
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
} from "../../../domain/facility.repository";
const defined = (_object: unknown, value: unknown) => value !== undefined;
/** Filters and page shared by the municipal list and the cross-municipality catalogue. */
export class FacilityFiltersRequestDTO {
  @ApiPropertyOptional({ description: "Text found in name or address" })
  @ValidateIf(defined)
  @IsString()
  @MaxLength(80)
  q?: string;
  @ApiPropertyOptional({ description: "Sport code" })
  @ValidateIf(defined)
  @Matches(SPORT_CODE)
  sport?: string;
  @ApiPropertyOptional({
    enum: ["true", "false"],
    description: "Only step-free (true) or only not (false)",
  })
  @ValidateIf(defined)
  @IsIn(["true", "false"])
  accessible?: "true" | "false";
  @ApiPropertyOptional({ description: "1-based page number", default: 1 })
  @ValidateIf(defined)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10000)
  page?: number;
  @ApiPropertyOptional({
    description: "Facilities per page",
    default: DEFAULT_PAGE_SIZE,
  })
  @ValidateIf(defined)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_SIZE)
  pageSize?: number;
}
export class ListFacilitiesRequestDTO extends FacilityFiltersRequestDTO {
  @ApiProperty({ description: "Municipality slug" })
  @IsString()
  @Matches(/^[a-z0-9-]{1,64}$/)
  slug!: string;
  @ApiPropertyOptional({
    enum: ["true", "false"],
    description: "Leave out closed facilities (shown last, marked, by default)",
  })
  @ValidateIf(defined)
  @IsIn(["true", "false"])
  hideClosed?: "true" | "false";
}
