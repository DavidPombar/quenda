// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsString,
  IsIn,
  IsInt,
  Min,
  Max,
  MaxLength,
  MinLength,
  IsBoolean,
  ValidateIf,
  IsNumber,
} from "class-validator";

export class UpdateFacilityRequestDTO {
  @ApiPropertyOptional({ description: "Facility name" })
  @ValidateIf((_object: unknown, value: unknown) => value !== undefined)
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;
  @ApiPropertyOptional({ description: "Sport" })
  @ValidateIf((_object: unknown, value: unknown) => value !== undefined)
  @IsIn(["padel", "tennis", "futsal", "swimming"])
  sport?: "padel" | "tennis" | "futsal" | "swimming";
  @ApiPropertyOptional({ description: "Postal address" })
  @ValidateIf((_object: unknown, value: unknown) => value !== undefined)
  @IsString()
  @MinLength(2)
  @MaxLength(250)
  address?: string;
  @ApiPropertyOptional({ description: "Description" })
  @ValidateIf((_object: unknown, value: unknown) => value !== undefined)
  @IsString()
  @MaxLength(2000)
  description?: string;
  @ApiPropertyOptional({ description: "Step-free access" })
  @ValidateIf((_object: unknown, value: unknown) => value !== undefined)
  @IsBoolean()
  accessible?: boolean;
  @ApiPropertyOptional({ description: "Operational status" })
  @ValidateIf((_object: unknown, value: unknown) => value !== undefined)
  @IsIn(["active", "maintenance", "closed"])
  status?: "active" | "maintenance" | "closed";
  @ApiPropertyOptional({ description: "Duration of one reservable slot" })
  @ValidateIf((_object: unknown, value: unknown) => value !== undefined)
  @IsIn([30, 60, 90, 120])
  slotMinutes?: number;
  @ApiPropertyOptional({
    description: "Indicative price in EUR cents; payment is outside V0",
  })
  @ValidateIf((_object: unknown, value: unknown) => value !== undefined)
  @IsInt()
  @Min(0)
  @Max(100000)
  priceCents?: number;
  @ApiPropertyOptional({
    description:
      "RFC 5545 VCALENDAR; recurring VEVENTs describe opening intervals",
  })
  @ValidateIf((_object: unknown, value: unknown) => value !== undefined)
  @IsString()
  @MaxLength(65536)
  openingCalendar?: string;
  @ApiPropertyOptional({ description: "Facility rules" })
  @ValidateIf((_object: unknown, value: unknown) => value !== undefined)
  @IsString()
  @MaxLength(2000)
  rules?: string;
  @ApiPropertyOptional({
    description:
      "Whether municipal holidays close this facility (default true)",
  })
  @ValidateIf((_object: unknown, value: unknown) => value !== undefined)
  @IsBoolean()
  followsMunicipalHolidays?: boolean;
  @ApiPropertyOptional({
    description:
      "Reason sent to people with upcoming bookings when closing; cancels those bookings",
  })
  @ValidateIf((_object: unknown, value: unknown) => value !== undefined)
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  closureReason?: string;
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
