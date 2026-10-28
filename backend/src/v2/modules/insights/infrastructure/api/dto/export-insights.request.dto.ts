// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, ValidateIf } from "class-validator";
import { InsightsRangeRequestDTO } from "./insights-range.request.dto";
export class ExportInsightsRequestDTO extends InsightsRangeRequestDTO {
  @ApiPropertyOptional({
    enum: ["gl", "es"],
    description: "Header language; defaults to Accept-Language",
  })
  @ValidateIf((_object: unknown, value: unknown) => value !== undefined)
  @IsIn(["gl", "es"])
  lang?: "gl" | "es";
}
