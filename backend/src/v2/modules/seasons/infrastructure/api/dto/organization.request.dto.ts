// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsBoolean,
  Matches,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from "class-validator";
import type { Sport } from "../../../domain/season.read-model";
export class OrganizationRequestDTO {
  @ApiProperty({ description: "Club, school or association name" })
  @IsString()
  @MaxLength(120)
  name!: string;
  @ApiPropertyOptional({ description: "Tax id (CIF)", nullable: true })
  @IsOptional()
  @ValidateIf((_object: unknown, value: unknown) => value !== null)
  @IsString()
  @MaxLength(20)
  taxId?: string | null;
  @ApiPropertyOptional({
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((_object: unknown, value: unknown) => value !== null)
  @Matches(/^[a-z0-9-]{2,40}$/)
  sport?: Sport | null;
  @ApiPropertyOptional({ description: "Contact address", nullable: true })
  @IsOptional()
  @ValidateIf((_object: unknown, value: unknown) => value !== null)
  @IsString()
  @MaxLength(254)
  contactEmail?: string | null;
}
export class UpdateOrganizationRequestDTO extends OrganizationRequestDTO {
  @ApiPropertyOptional({ description: "Archive (true) or restore (false)" })
  @IsOptional()
  @IsBoolean()
  archived?: boolean;
}
