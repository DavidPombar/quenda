// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsISO8601, IsOptional, IsString, MaxLength } from "class-validator";
export class CheckInRequestDTO {
  @ApiProperty({ description: "Scanned credential (compact JWS)" })
  @IsString()
  @MaxLength(2048)
  token!: string;
  @ApiPropertyOptional({
    description:
      "When a scan queued offline happened (ISO 8601, at most 24 h ago)",
  })
  @IsOptional()
  @IsISO8601({ strict: true })
  scannedAt?: string;
}
