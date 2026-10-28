// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, Matches } from "class-validator";
export class AccessDayQueryRequestDTO {
  @ApiPropertyOptional({
    description:
      "Local date (YYYY-MM-DD); today in the municipality by default",
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date?: string;
}
