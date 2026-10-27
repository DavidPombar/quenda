// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsUUID, Matches } from "class-validator";
export class ManagedBookingsQueryRequestDTO {
  @ApiProperty({ description: "Local calendar date, YYYY-MM-DD" })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date!: string;
  @ApiPropertyOptional({ description: "Only this facility" })
  @IsOptional()
  @IsUUID()
  facilityId?: string;
}
