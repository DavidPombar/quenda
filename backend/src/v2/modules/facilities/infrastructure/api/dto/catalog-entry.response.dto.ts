// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import {
  CatalogEntry,
  Page,
  PageRequest,
} from "../../../domain/facility.repository";
import { LocalizedTextResponseDTO } from "./localized-text.response.dto";
import { FacilityPhotoResponseDTO } from "./facility-photo.response.dto";
export class CatalogMunicipalityDTO {
  @ApiProperty({ description: "Public municipality identifier" }) slug!: string;
  @ApiProperty({ description: "Municipality name" }) name!: string;
}
export class CatalogEntryResponseDTO {
  @ApiProperty({ description: "Facility UUID" }) id!: string;
  @ApiProperty({ description: "Facility name" }) name!: string;
  @ApiProperty({ description: "Sport code" }) sport!: string;
  @ApiProperty({ type: LocalizedTextResponseDTO, description: "Sport name" })
  sportName!: LocalizedTextResponseDTO;
  @ApiProperty({ description: "Postal address" }) address!: string;
  @ApiProperty({ description: "Description" }) description!: string;
  @ApiProperty({ description: "Step-free access" }) accessible!: boolean;
  @ApiProperty({ description: "Always active in the catalogue" }) status!:
    "active" | "maintenance" | "closed";
  @ApiProperty({ description: "Duration of one reservable slot" })
  slotMinutes!: number;
  @ApiProperty({ description: "Indicative price in EUR cents" })
  priceCents!: number;
  @ApiProperty({ type: Number, nullable: true }) latitude!: number | null;
  @ApiProperty({ type: Number, nullable: true }) longitude!: number | null;
  @ApiProperty({ type: FacilityPhotoResponseDTO, nullable: true })
  photo!: FacilityPhotoResponseDTO | null;
  @ApiProperty({ type: CatalogMunicipalityDTO })
  municipality!: CatalogMunicipalityDTO;
  static from(value: CatalogEntry): CatalogEntryResponseDTO {
    return {
      id: value.id,
      name: value.name,
      sport: value.sport,
      sportName: { gl: value.sportName.gl, es: value.sportName.es },
      address: value.address,
      description: value.description,
      accessible: value.accessible,
      status: value.status,
      slotMinutes: value.slotMinutes,
      priceCents: value.priceCents,
      latitude: value.latitude,
      longitude: value.longitude,
      photo:
        value.photo && FacilityPhotoResponseDTO.from(value.id, value.photo),
      municipality: {
        slug: value.municipality.slug,
        name: value.municipality.name,
      },
    };
  }
}
export class CatalogPageResponseDTO {
  @ApiProperty({ type: [CatalogEntryResponseDTO] })
  items!: CatalogEntryResponseDTO[];
  @ApiProperty({ description: "Facilities matching the filters" })
  total!: number;
  @ApiProperty({ description: "1-based page number" }) page!: number;
  @ApiProperty({ description: "Facilities per page" }) pageSize!: number;
  static from(value: Page<CatalogEntry> & PageRequest): CatalogPageResponseDTO {
    return {
      items: value.items.map(CatalogEntryResponseDTO.from),
      total: value.total,
      page: value.page,
      pageSize: value.size,
    };
  }
}
