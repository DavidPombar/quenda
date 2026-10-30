// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { IsString, Matches, MaxLength } from "class-validator";
export class VerifyEmailCodeRequestDTO {
  @ApiProperty({ description: "Municipality slug" })
  @IsString()
  @Matches(/^[a-z0-9-]{1,64}$/)
  slug!: string;
  @ApiProperty({ description: "Address the code was sent to" })
  @IsString()
  @MaxLength(254)
  email!: string;
  @ApiProperty({ description: "Six-digit code from the mail" })
  @IsString()
  @MaxLength(16)
  code!: string;
}
