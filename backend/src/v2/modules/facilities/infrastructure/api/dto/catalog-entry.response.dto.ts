// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { SPORT_ARTS, SportNameDTO } from "./sport.response.dto";
import { CatalogEntry } from "../../../domain/facility.repository";
export class CatalogMunicipalityDTO {
  @ApiProperty({ description: "Public municipality identifier" }) slug!: string;
  @ApiProperty({ description: "Municipality name" }) name!: string;
}
export class CatalogEntryResponseDTO {
  @ApiProperty({ description: "Facility UUID" }) id!: string;
  @ApiProperty({ description: "Facility name" }) name!: string;
  @ApiProperty({ description: "Sport code" }) sport!: string;
  @ApiProperty({ type: SportNameDTO, description: "Sport name" })
  sportName!: SportNameDTO;
  @ApiProperty({ enum: SPORT_ARTS, description: "Sport illustration" })
  sportArt!: string;
  @ApiProperty({ description: "Postal address" }) address!: string;
  @ApiProperty({ description: "Description" }) description!: string;
  @ApiProperty({ description: "Step-free access" }) accessible!: boolean;
  @ApiProperty({ description: "Always active in the catalogue" }) status!:
    "active" | "maintenance" | "closed";
  @ApiProperty({ description: "Duration of one reservable slot" })
  slotMinutes!: number;
  @ApiProperty({ description: "Indicative price in EUR cents" })
  priceCents!: number;
  @ApiProperty({ type: CatalogMunicipalityDTO })
  municipality!: CatalogMunicipalityDTO;
  static from(value: CatalogEntry): CatalogEntryResponseDTO {
    return {
      id: value.id,
      name: value.name,
      sport: value.sport,
      sportName: SportNameDTO.from(value.sportName),
      sportArt: value.sportArt,
      address: value.address,
      description: value.description,
      accessible: value.accessible,
      status: value.status,
      slotMinutes: value.slotMinutes,
      priceCents: value.priceCents,
      municipality: {
        slug: value.municipality.slug,
        name: value.municipality.name,
      },
    };
  }
}
