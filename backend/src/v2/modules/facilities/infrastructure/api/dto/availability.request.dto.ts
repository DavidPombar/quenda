// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { IsString, Matches } from "class-validator";

export class AvailabilityRequestDTO {
  @ApiProperty({ description: "Municipality slug" })
  @IsString()
  @Matches(/^[a-z0-9-]{1,64}$/)
  slug!: string;
  @ApiProperty({ description: "Local date in municipality time zone" })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date!: string;
}
