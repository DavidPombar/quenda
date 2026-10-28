// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, MaxLength } from "class-validator";
export class CitizenSearchRequestDTO {
  @ApiPropertyOptional({ description: "Part of the citizen's name" })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  query?: string;
}
