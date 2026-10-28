// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import {
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
}
export class MunicipalityPathRequestDTO {
  @ApiProperty({ description: "Municipality UUID" })
  @IsUUID()
  id!: string;
}
