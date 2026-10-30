// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, Matches } from "class-validator";
import { OpenDataRequestDTO } from "./open-data.request.dto";

export class OpenOccupancyRequestDTO extends OpenDataRequestDTO {
  @ApiPropertyOptional({
    description:
      "First local date (YYYY-MM-DD); with `to`, at most 16 months. Default: the last 12 complete ISO weeks",
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  from?: string;
  @ApiPropertyOptional({ description: "Last local date (YYYY-MM-DD)" })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  to?: string;
}
