// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsUUID } from "class-validator";
export class MarkUncheckedNoShowsRequestDTO {
  @ApiPropertyOptional({ description: "Only this facility" })
  @IsOptional()
  @IsUUID()
  facilityId?: string;
}
