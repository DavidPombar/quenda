// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsUUID, MaxLength, ValidateIf } from "class-validator";

export class JoinWaitlistRequestDTO {
  @ApiProperty({ description: "Client-generated idempotent entry UUID" })
  @IsUUID()
  id!: string;
  @ApiProperty({ description: "Facility UUID" })
  @IsUUID()
  facilityId!: string;
  @ApiPropertyOptional({
    description:
      "Resource (court or space) UUID; required when the facility has more than one active resource",
  })
  @ValidateIf((_object: unknown, value: unknown) => value !== undefined)
  @IsUUID()
  resourceId?: string;
  @ApiProperty({ description: "Start of the full slot, ISO 8601 with offset" })
  @IsString()
  @MaxLength(64)
  start!: string;
}
