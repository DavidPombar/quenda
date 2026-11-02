// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsIn, IsInt, IsUUID, Matches, Max, Min, ValidateIf } from "class-validator";
import { SlugRequestDTO } from "./slug.request.dto";
import { SPORT_CODE } from "../../../../facilities/domain/sport.repository";
import {
  ACTIVITY_PAGE_SIZE,
  MAX_ACTIVITY_PAGE_SIZE,
} from "../../../domain/activity.repository";
const defined = (_object: unknown, value: unknown) => value !== undefined;
export class ListActivitiesRequestDTO extends SlugRequestDTO {
  @ApiPropertyOptional({ description: "Sport code" })
  @ValidateIf(defined)
  @Matches(SPORT_CODE)
  sport?: string;
  @ApiPropertyOptional({ description: "Facility UUID" })
  @ValidateIf(defined)
  @IsUUID()
  facility?: string;
  @ApiPropertyOptional({ description: "Only activities that accept this age" })
  @ValidateIf(defined)
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(120)
  age?: number;
  @ApiPropertyOptional({
    enum: ["true", "false"],
    description: "Only activities whose enrolment is open today",
  })
  @ValidateIf(defined)
  @IsIn(["true", "false"])
  open?: "true" | "false";
  @ApiPropertyOptional({ description: "1-based page number", default: 1 })
  @ValidateIf(defined)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10000)
  page?: number;
  @ApiPropertyOptional({
    description: "Activities per page",
    default: ACTIVITY_PAGE_SIZE,
  })
  @ValidateIf(defined)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_ACTIVITY_PAGE_SIZE)
  pageSize?: number;
}
