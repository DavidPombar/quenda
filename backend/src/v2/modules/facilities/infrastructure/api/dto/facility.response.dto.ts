// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { CategoryPriceResponseDTO } from "./category-price.response.dto";
import { FacilityDetails } from "../../../domain/facility.read-model";
import type { SportArt } from "../../../domain/sport.entity";
import { ResourceResponseDTO } from "./resource.response.dto";
import { LocalizedTextResponseDTO } from "./localized-text.response.dto";
import { FacilityPhotoResponseDTO } from "./facility-photo.response.dto";
export class FacilityResponseDTO {
  @ApiProperty({ description: "Facility UUID" }) id!: string;
  @ApiProperty({ description: "Facility name" }) name!: string;
  @ApiProperty({ description: "Code from the municipality's sports catalogue" })
  sport!: string;
  @ApiProperty({ type: LocalizedTextResponseDTO, description: "Sport name" })
  sportName!: LocalizedTextResponseDTO;
  @ApiProperty({
    enum: ["padel", "tennis", "futsal", "swimming", "generic"],
    description: "Illustration and colour of the sport",
  })
  sportArt!: SportArt;
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
  @ApiProperty({
    description: "WGS 84 latitude, or null when not set",
    type: Number,
    nullable: true,
  })
  latitude!: number | null;
  @ApiProperty({
    description: "WGS 84 longitude, or null when not set",
    type: Number,
    nullable: true,
  })
  longitude!: number | null;
  @ApiProperty({
    description: "Bookable courts or spaces, ordered by position and name",
    type: [ResourceResponseDTO],
  })
  resources!: ResourceResponseDTO[];
  @ApiProperty({
    description: "Photos in gallery order",
    type: [FacilityPhotoResponseDTO],
  })
  photos!: FacilityPhotoResponseDTO[];
  static from(value: FacilityDetails): FacilityResponseDTO {
    return {
      id: value.id,
      name: value.name,
      sport: value.sport,
      sportName: { gl: value.sportName.gl, es: value.sportName.es },
      sportArt: value.sportArt,
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
      latitude: value.latitude,
      longitude: value.longitude,
      resources: value.resources.map(ResourceResponseDTO.from),
      photos: value.photos.map((photo) =>
        FacilityPhotoResponseDTO.from(value.id, photo),
      ),
    };
  }
}
