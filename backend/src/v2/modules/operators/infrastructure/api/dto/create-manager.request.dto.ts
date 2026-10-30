// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsOptional,
  Matches,
  IsEmail,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from "class-validator";
export class CreateManagerRequestDTO {
  @ApiProperty({ description: "Client-generated UUID; retries are idempotent" })
  @IsUUID()
  id!: string;
  @ApiProperty({ description: "Name shown to the municipality's staff" })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  displayName!: string;
  @ApiProperty({
    description:
      "Work address, used to link an identity provider account (#36)",
  })
  @IsEmail()
  @MaxLength(254)
  email!: string;
  @ApiPropertyOptional({
    description:
      "Login for a local account with password and second factor; a temporary password is returned once",
  })
  @IsOptional()
  @Matches(/^[A-Za-z0-9._-]{3,64}$/)
  login?: string;
}
export class MunicipalityPathRequestDTO {
  @ApiProperty({ description: "Municipality UUID" })
  @IsUUID()
  id!: string;
}
