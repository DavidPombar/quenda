// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsIn,
  IsInt,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
  ValidateNested,
} from "class-validator";
export class NewLegalTextsRequestDTO {
  @ApiProperty({ description: "Privacy notice in Galician" })
  @IsString()
  @MinLength(20)
  @MaxLength(20000)
  gl!: string;
  @ApiProperty({ description: "Privacy notice in Spanish" })
  @IsString()
  @MinLength(20)
  @MaxLength(20000)
  es!: string;
}
const defined = (_object: unknown, value: unknown) => value !== undefined;
export class CreateMunicipalityRequestDTO {
  @ApiProperty({ description: "Client-generated UUID; retries are idempotent" })
  @IsUUID()
  id!: string;
  @ApiProperty({ description: "Public identifier used in URLs" })
  @Matches(/^[a-z0-9](?:[a-z0-9-]{1,62}[a-z0-9])$/)
  slug!: string;
  @ApiProperty({ description: "Municipality name" })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;
  @ApiProperty({ description: "IANA time zone, e.g. Europe/Madrid" })
  @IsString()
  @MaxLength(64)
  timezone!: string;
  @ApiProperty({ enum: ["gl", "es"], description: "Default language" })
  @IsIn(["gl", "es"])
  locale!: "gl" | "es";
  @ApiProperty({ description: "Municipal contact address" })
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  contact!: string;
  @ApiProperty({ type: NewLegalTextsRequestDTO })
  @ValidateNested()
  @Type(() => NewLegalTextsRequestDTO)
  legalTexts!: NewLegalTextsRequestDTO;
  @ApiPropertyOptional({ description: "Booking horizon in days (1–90)" })
  @ValidateIf(defined)
  @IsInt()
  @Min(1)
  @Max(90)
  advanceDays?: number;
  @ApiPropertyOptional({ description: "Hours to change or cancel (0–168)" })
  @ValidateIf(defined)
  @IsInt()
  @Min(0)
  @Max(168)
  cancellationHours?: number;
  @ApiPropertyOptional({ description: "Upcoming bookings per person (1–50)" })
  @ValidateIf(defined)
  @IsInt()
  @Min(1)
  @Max(50)
  maxActiveBookings?: number;
}
