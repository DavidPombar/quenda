// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsUUID, MaxLength, ValidateIf } from "class-validator";

export class CreateBookingRequestDTO {
  @ApiProperty({ description: "Client-generated idempotent booking UUID" })
  @IsUUID()
  id!: string;
  @ApiProperty({ description: "Facility UUID" })
  @IsUUID()
  facilityId!: string;
  @ApiPropertyOptional({
    description:
      "Resource (court or space) UUID of the facility; required when it has more than one active resource",
  })
  @ValidateIf((_object: unknown, value: unknown) => value !== undefined)
  @IsUUID()
  resourceId?: string;
  @ApiProperty({ description: "ISO 8601 instant with UTC offset" })
  @IsString()
  @MaxLength(64)
  start!: string;
}
