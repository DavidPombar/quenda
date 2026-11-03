// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsIn, IsInt, Max, Min, ValidateIf } from "class-validator";
import { ENROLMENT_PAGE_SIZE } from "../../../domain/enrolment.repository";
const defined = (_object: unknown, value: unknown) => value !== undefined;
export class ListEnrolmentsRequestDTO {
  @ApiPropertyOptional({
    enum: ["enrolled", "waiting"],
    description:
      "Only people holding a place, or only those waiting; both by default",
  })
  @ValidateIf(defined)
  @IsIn(["enrolled", "waiting"])
  status?: "enrolled" | "waiting";
  @ApiPropertyOptional({ description: "1-based page number", default: 1 })
  @ValidateIf(defined)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10000)
  page?: number;
  @ApiPropertyOptional({ default: ENROLMENT_PAGE_SIZE })
  @ValidateIf(defined)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;
}
