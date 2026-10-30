// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, Matches, MaxLength } from "class-validator";
export class PasswordLoginRequestDTO {
  @ApiPropertyOptional({
    description: "Municipality slug (staff of a municipality)",
  })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9-]{1,64}$/)
  slug?: string;
  @ApiProperty({ description: "Login name" })
  @IsString()
  @MaxLength(64)
  login!: string;
  @ApiProperty({ description: "Password" })
  @IsString()
  @MaxLength(256)
  password!: string;
}
export class PasswordChangeRequestDTO {
  @ApiProperty({ description: "Ticket from the previous step" })
  @IsString()
  @MaxLength(128)
  ticket!: string;
  @ApiProperty({ description: "New password, at least 12 characters" })
  @IsString()
  @MaxLength(256)
  newPassword!: string;
}
export class TotpLoginRequestDTO {
  @ApiProperty({ description: "Ticket from the previous step" })
  @IsString()
  @MaxLength(128)
  ticket!: string;
  @ApiProperty({ description: "Six-digit code from the authenticator app" })
  @IsString()
  @MaxLength(16)
  code!: string;
}
