// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from "class-validator";
export class ConfigureAccessWebhookRequestDTO {
  @ApiProperty({
    type: String,
    nullable: true,
    description: "HTTPS endpoint, or null to stop announcing changes",
  })
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(500)
  url!: string | null;
  @ApiPropertyOptional({ description: "Replace the signing secret" })
  @IsOptional()
  @IsBoolean()
  rotateSecret?: boolean;
}
