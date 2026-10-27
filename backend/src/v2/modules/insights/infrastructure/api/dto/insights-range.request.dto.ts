// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiPropertyOptional } from "@nestjs/swagger";
import { Matches, ValidateIf } from "class-validator";
const defined = (_object: unknown, value: unknown) => value !== undefined;
export class InsightsRangeRequestDTO {
  @ApiPropertyOptional({
    description: "First local date (YYYY-MM-DD); defaults to today",
  })
  @ValidateIf(defined)
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  from?: string;
  @ApiPropertyOptional({
    description:
      "Last local date, inclusive (YYYY-MM-DD); at most 16 months after from",
  })
  @ValidateIf(defined)
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  to?: string;
}
