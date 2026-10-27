// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { Facility } from "../../../domain/facility.entity";
import { CategoryPriceResponseDTO } from "./category-price.response.dto";
export class FacilityResponseDTO {
  @ApiProperty({ description: "Facility UUID" }) id!: string;
  @ApiProperty({ description: "Facility name" }) name!: string;
  @ApiProperty({ description: "Sport" }) sport!:
    "padel" | "tennis" | "futsal" | "swimming";
  @ApiProperty({ description: "Postal address" }) address!: string;
  @ApiProperty({ description: "Description" }) description!: string;
  @ApiProperty({ description: "Step-free access" }) accessible!: boolean;
  @ApiProperty({ description: "Operational status" }) status!:
    "active" | "maintenance" | "closed";
  @ApiProperty({ description: "Duration of one reservable slot" })
  slotMinutes!: number;
  @ApiProperty({
    description: "General indicative price in EUR cents; payment is outside V0",
  })
  priceCents!: number;
  @ApiProperty({
    type: [CategoryPriceResponseDTO],
    description:
      "Indicative prices for verified user categories; everyone else pays priceCents",
  })
  prices!: CategoryPriceResponseDTO[];
  @ApiProperty({
    description:
      "RFC 5545 VCALENDAR; recurring VEVENTs describe opening intervals",
  })
  openingCalendar!: string;
  @ApiProperty({ description: "Facility rules" }) rules!: string;
  @ApiProperty({
    description: "Whether municipal holidays close this facility",
  })
  followsMunicipalHolidays!: boolean;
  static from(value: Facility): FacilityResponseDTO {
    return {
      id: value.id,
      name: value.name,
      sport: value.sport,
      address: value.address,
      description: value.description,
      accessible: value.accessible,
      status: value.status,
      slotMinutes: value.slotMinutes,
      priceCents: value.priceCents,
      prices: value.prices.map(CategoryPriceResponseDTO.from),
      openingCalendar: value.openingCalendar,
      rules: value.rules,
      followsMunicipalHolidays: value.followsMunicipalHolidays,
    };
  }
}
