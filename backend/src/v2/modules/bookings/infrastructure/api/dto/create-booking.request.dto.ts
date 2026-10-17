// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsUUID, MaxLength } from "class-validator";

export class CreateBookingRequestDTO {
  @ApiProperty({ description: "Client-generated idempotent booking UUID" })
  @IsUUID()
  id!: string;
  @ApiProperty({ description: "Facility UUID" })
  @IsUUID()
  facilityId!: string;
  @ApiProperty({ description: "ISO 8601 instant with UTC offset" })
  @IsString()
  @MaxLength(64)
  start!: string;
}
