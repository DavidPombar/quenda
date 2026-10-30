// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, MaxLength, ValidateIf } from "class-validator";
/** The image travels as the raw body, so its alternative text goes in the query. */
export class UploadPhotoRequestDTO {
  @ApiProperty({ description: "Alternative text in Galician (required)" })
  @IsString()
  @MaxLength(250)
  altGl!: string;
  @ApiPropertyOptional({ description: "Alternative text in Spanish" })
  @ValidateIf((_object: unknown, value: unknown) => value !== undefined)
  @IsString()
  @MaxLength(250)
  altEs?: string;
}
