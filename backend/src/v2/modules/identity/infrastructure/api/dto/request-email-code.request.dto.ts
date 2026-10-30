// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from "class-validator";
export class RequestEmailCodeRequestDTO {
  @ApiProperty({ description: "Municipality slug" })
  @IsString()
  @Matches(/^[a-z0-9-]{1,64}$/)
  slug!: string;
  @ApiProperty({ description: "Address that receives the one-time code" })
  @IsString()
  @MaxLength(254)
  email!: string;
  @ApiProperty({
    description:
      "Privacy notice version the citizen accepts; must match the municipality's current version",
  })
  @IsString()
  @MaxLength(32)
  legalVersion!: string;
  @ApiPropertyOptional({
    enum: ["gl", "es"],
    description: "Language of the mail",
  })
  @IsOptional()
  @IsIn(["gl", "es"])
  locale?: "gl" | "es";
}
