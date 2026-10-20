// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsISO8601,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";
export class AuditQueryRequestDTO {
  @ApiPropertyOptional({
    description: "Inclusive lower bound, ISO 8601 instant with offset",
  })
  @IsOptional()
  @IsISO8601({ strict: true })
  from?: string;
  @ApiPropertyOptional({
    description: "Exclusive upper bound, ISO 8601 instant with offset",
  })
  @IsOptional()
  @IsISO8601({ strict: true })
  to?: string;
  @ApiPropertyOptional({
    description: "Exact action name, e.g. booking.created",
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  action?: string;
  @ApiPropertyOptional({
    description: "Maximum number of events",
    minimum: 1,
    maximum: 500,
    default: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  limit?: number;
}
