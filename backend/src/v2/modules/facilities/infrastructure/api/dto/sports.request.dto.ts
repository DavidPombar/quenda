// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiPropertyOptional } from "@nestjs/swagger";
import { Matches, ValidateIf } from "class-validator";

export class SportsRequestDTO {
  @ApiPropertyOptional({
    description:
      "Comma-separated municipality slugs; without it, every municipality of the deployment",
  })
  @ValidateIf((_object: unknown, value: unknown) => value !== undefined)
  @Matches(/^[a-z0-9-]{1,64}(,[a-z0-9-]{1,64}){0,49}$/)
  municipality?: string;
}
