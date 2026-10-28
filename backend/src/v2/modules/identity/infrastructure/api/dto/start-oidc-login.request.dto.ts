// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, Matches, MaxLength } from "class-validator";
export class StartOidcLoginRequestDTO {
  @ApiProperty({ description: "Municipality slug" })
  @IsString()
  @Matches(/^[a-z0-9-]{1,64}$/)
  slug!: string;
  @ApiPropertyOptional({
    description:
      "Privacy notice version the citizen accepts; must match the municipality's current version",
  })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  legalVersion?: string;
  @ApiPropertyOptional({
    description:
      "Citizen app path to return to after signing in. Must start with /app/; anything else is replaced by /app/<slug>/instalacions",
    example: "/app/vilaverde/reservas",
  })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  returnTo?: string;
}
