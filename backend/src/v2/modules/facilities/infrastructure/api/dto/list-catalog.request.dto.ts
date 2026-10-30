// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiPropertyOptional } from "@nestjs/swagger";
import { Matches, ValidateIf } from "class-validator";
import { FacilityFiltersRequestDTO } from "./list-facilities.request.dto";
const defined = (_object: unknown, value: unknown) => value !== undefined;
export class ListCatalogRequestDTO extends FacilityFiltersRequestDTO {
  @ApiPropertyOptional({
    description: "Comma-separated municipality slugs; all when omitted",
  })
  @ValidateIf(defined)
  @Matches(/^[a-z0-9-]{1,64}(,[a-z0-9-]{1,64}){0,49}$/)
  municipality?: string;
}
