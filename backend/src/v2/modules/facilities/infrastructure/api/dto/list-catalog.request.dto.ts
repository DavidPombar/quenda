// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsIn,
  IsString,
  Matches,
  MaxLength,
  ValidateIf,
} from "class-validator";
const defined = (_object: unknown, value: unknown) => value !== undefined;
export class ListCatalogRequestDTO {
  @ApiPropertyOptional({ description: "Text found in name or address" })
  @ValidateIf(defined)
  @IsString()
  @MaxLength(80)
  q?: string;
  @ApiPropertyOptional({ enum: ["padel", "tennis", "futsal", "swimming"] })
  @ValidateIf(defined)
  @IsIn(["padel", "tennis", "futsal", "swimming"])
  sport?: "padel" | "tennis" | "futsal" | "swimming";
  @ApiPropertyOptional({
    enum: ["true", "false"],
    description: "Only step-free (true) or only not (false)",
  })
  @ValidateIf(defined)
  @IsIn(["true", "false"])
  accessible?: "true" | "false";
  @ApiPropertyOptional({
    description: "Comma-separated municipality slugs; all when omitted",
  })
  @ValidateIf(defined)
  @Matches(/^[a-z0-9-]{1,64}(,[a-z0-9-]{1,64}){0,49}$/)
  municipality?: string;
}
