// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsString,
  IsIn,
  IsOptional,
  Matches,
  MaxLength,
} from "class-validator";

export class CreateSessionRequestDTO {
  @ApiProperty({ description: "Municipality slug" })
  @IsString()
  @Matches(/^[a-z0-9-]{1,64}$/)
  slug!: string;
  @ApiProperty({
    description: "Demo account to use; unavailable unless DEMO_MODE=true",
  })
  @IsIn(["citizen", "manager", "staff"])
  role!: "citizen" | "manager" | "staff";
  @ApiPropertyOptional({
    description:
      "Privacy notice version the citizen accepts; must match the municipality's current version",
  })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  legalVersion?: string;
}
