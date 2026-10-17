// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsUUID,
  IsIn,
  IsInt,
  Min,
  Max,
  MaxLength,
  MinLength,
  IsBoolean,
} from "class-validator";

export class CreateFacilityRequestDTO {
  @ApiProperty({ description: "Client-generated facility UUID" })
  @IsUUID()
  id!: string;
  @ApiProperty({ description: "Facility name" })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;
  @ApiProperty({ description: "Sport" })
  @IsIn(["padel", "tennis", "futsal", "swimming"])
  sport!: "padel" | "tennis" | "futsal" | "swimming";
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
}
