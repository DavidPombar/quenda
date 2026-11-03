// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, ValidateIf } from "class-validator";
export class CsvLanguageRequestDTO {
  @ApiPropertyOptional({
    enum: ["gl", "es"],
    description: "Language of the headers; downloads are plain navigations",
  })
  @ValidateIf((_object: unknown, value: unknown) => value !== undefined)
  @IsIn(["gl", "es"])
  lang?: "gl" | "es";
}
