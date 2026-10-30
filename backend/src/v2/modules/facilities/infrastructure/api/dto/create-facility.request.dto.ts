// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  ValidateNested,
  IsString,
  IsUUID,
  IsIn,
  IsInt,
  Min,
  Max,
  MaxLength,
  MinLength,
  IsBoolean,
  IsNumber,
  ValidateIf,
  Matches,
} from "class-validator";
import { CATEGORIES } from "../../../../../shared/application/categories";
import { CategoryPriceRequestDTO } from "./category-price.request.dto";

export class CreateFacilityRequestDTO {
  @ApiProperty({ description: "Client-generated facility UUID" })
  @IsUUID()
  id!: string;
  @ApiProperty({ description: "Facility name" })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;
  @ApiProperty({
    description: "Code of a sport in the municipality's catalogue",
  })
  @Matches(/^[a-z0-9-]{2,40}$/)
  sport!: string;
  @ApiProperty({ description: "Postal address" })
  @IsString()
  @MinLength(2)
  @MaxLength(250)
  address!: string;
  @ApiProperty({ description: "Description" })
  @IsString()
  @MaxLength(2000)
  description!: string;
  @ApiProperty({ description: "Step-free access" })
  @IsBoolean()
  accessible!: boolean;
  @ApiProperty({ description: "Operational status" })
  @IsIn(["active", "maintenance", "closed"])
  status!: "active" | "maintenance" | "closed";
  @ApiProperty({ description: "Duration of one reservable slot" })
  @IsIn([30, 60, 90, 120])
  slotMinutes!: number;
  @ApiProperty({
    description: "Indicative price in EUR cents; payment is outside V0",
  })
  @IsInt()
  @Min(0)
  @Max(100000)
  priceCents!: number;
  @ApiProperty({
    description:
      "RFC 5545 VCALENDAR; recurring VEVENTs describe opening intervals",
  })
  @IsString()
  @MaxLength(65536)
  openingCalendar!: string;
  @ApiProperty({ description: "Facility rules" })
  @IsString()
  @MaxLength(2000)
  rules!: string;
  @ApiPropertyOptional({
    description:
      "Whether municipal holidays close this facility (default true)",
  })
  @ValidateIf((_object: unknown, value: unknown) => value !== undefined)
  @IsBoolean()
  followsMunicipalHolidays?: boolean;
  @ApiPropertyOptional({
    type: [CategoryPriceRequestDTO],
    description:
      "Prices per user category; replaces the whole list. Categories without a price pay priceCents",
  })
  @ValidateIf((_object: unknown, value: unknown) => value !== undefined)
  @IsArray()
  @ArrayMaxSize(CATEGORIES.length)
  @ValidateNested({ each: true })
  @Type(() => CategoryPriceRequestDTO)
  prices?: CategoryPriceRequestDTO[];
  @ApiPropertyOptional({
    description: "WGS 84 latitude; set together with longitude or both null",
    type: Number,
    nullable: true,
  })
  @ValidateIf((_object: unknown, value: unknown) => value != null)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(-90)
  @Max(90)
  latitude?: number | null;
  @ApiPropertyOptional({
    description: "WGS 84 longitude; set together with latitude or both null",
    type: Number,
    nullable: true,
  })
  @ValidateIf((_object: unknown, value: unknown) => value != null)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(-180)
  @Max(180)
  longitude?: number | null;
}
