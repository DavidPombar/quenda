// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsOptional, IsString, MaxLength } from "class-validator";
export class AccessWebhookRequestDTO {
  @ApiProperty({ description: "HTTP(S) endpoint; empty disables the webhook" })
  @IsString()
  @MaxLength(500)
  url!: string;
  @ApiPropertyOptional({ description: "Generate a new signing secret" })
  @IsOptional()
  @IsBoolean()
  rotateSecret?: boolean;
}
