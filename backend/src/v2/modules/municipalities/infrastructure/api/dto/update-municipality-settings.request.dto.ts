// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiPropertyOptional, ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { CATEGORIES } from "../../../../../shared/application/categories";
import {
  dataLicenses,
  type DataLicense,
} from "../../../../../shared/application/municipality-settings";
import type { Category } from "../../../../../shared/application/categories";
import {
  ArrayMaxSize,
  IsArray,
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
export class LegalTextsRequestDTO {
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
export class UpdateMunicipalitySettingsRequestDTO {
  @ApiPropertyOptional({ enum: ["gl", "es"], description: "Default language" })
  @ValidateIf(defined)
  @IsIn(["gl", "es"])
  locale?: "gl" | "es";
  @ApiPropertyOptional({ description: "Booking horizon in local days (1–90)" })
  @ValidateIf(defined)
  @IsInt()
  @Min(1)
  @Max(90)
  advanceDays?: number;
  @ApiPropertyOptional({
    description: "Hours before start to change or cancel (0–168)",
  })
  @ValidateIf(defined)
  @IsInt()
  @Min(0)
  @Max(168)
  cancellationHours?: number;
  @ApiPropertyOptional({
    description: "Upcoming reservations per person (1–50)",
  })
  @ValidateIf(defined)
  @IsInt()
  @Min(1)
  @Max(50)
  maxActiveBookings?: number;
  @ApiPropertyOptional({ description: "Municipal contact address" })
  @ValidateIf(defined)
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  contact?: string;
  @ApiPropertyOptional({
    type: LegalTextsRequestDTO,
    description:
      "New privacy notice in both languages; publishes a new version citizens must accept",
  })
  @ValidateIf(defined)
  @ValidateNested()
  @Type(() => LegalTextsRequestDTO)
  legalTexts?: LegalTextsRequestDTO;
  @ApiPropertyOptional({
    description: "Brand colour #rrggbb; needs 4.5:1 contrast on white",
  })
  @ValidateIf(defined)
  @Matches(/^#[0-9a-fA-F]{6}$/)
  primaryColor?: string;
  @ApiPropertyOptional({
    description: "RFC 5545 VCALENDAR of all-day holidays; empty for none",
  })
  @ValidateIf(defined)
  @IsString()
  @MaxLength(65536)
  holidaysCalendar?: string;
  @ApiPropertyOptional({
    enum: CATEGORIES,
    isArray: true,
    description:
      "User categories residents can request and facilities can price; the rest pay the general tariff",
  })
  @ValidateIf(defined)
  @IsArray()
  @ArrayMaxSize(CATEGORIES.length)
  @IsIn(CATEGORIES, { each: true })
  enabledCategories?: Category[];
  @ApiPropertyOptional({
    description:
      "No-shows within the window that block bookings (0–20, 0 disables)",
  })
  @ValidateIf(defined)
  @IsInt()
  @Min(0)
  @Max(20)
  noShowLimit?: number;
  @ApiPropertyOptional({ description: "Days in which no-shows count (1–365)" })
  @ValidateIf(defined)
  @IsInt()
  @Min(1)
  @Max(365)
  noShowWindowDays?: number;
  @ApiPropertyOptional({
    description: "Days without booking once blocked (1–365)",
  })
  @ValidateIf(defined)
  @IsInt()
  @Min(1)
  @Max(365)
  noShowBlockDays?: number;
  @ApiPropertyOptional({
    enum: dataLicenses,
    description: "Licence of the published open data (T3, #21)",
  })
  @ValidateIf(defined)
  @IsIn(dataLicenses)
  dataLicense?: DataLicense;
  @ApiPropertyOptional({
    type: String,
    nullable: true,
    description:
      "DIR3 code of the municipality, publisher of the DCAT catalogue; null or empty removes it",
  })
  @ValidateIf((_object: unknown, value: unknown) => !!value)
  @Matches(/^[A-Za-z0-9]{9}$/)
  dir3Code?: string | null;
  @ApiPropertyOptional({
    description:
      "Base URL of the council's own Umami (https); empty switches web analytics off (#25)",
  })
  @ValidateIf(defined)
  @IsString()
  @MaxLength(300)
  analyticsUrl?: string;
  @ApiPropertyOptional({
    type: String,
    nullable: true,
    description: "Umami website id; null or empty when analytics is off",
  })
  @ValidateIf((_object: unknown, value: unknown) => !!value)
  @IsUUID()
  analyticsWebsiteId?: string | null;
}
