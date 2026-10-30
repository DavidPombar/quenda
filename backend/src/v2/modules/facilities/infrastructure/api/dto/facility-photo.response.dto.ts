// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { LocalizedTextResponseDTO } from "./localized-text.response.dto";
export class FacilityPhotoResponseDTO {
  @ApiProperty({ description: "Photo UUID" }) id!: string;
  @ApiProperty({ description: "Versioned image URL, cacheable for a year" })
  url!: string;
  @ApiProperty({
    type: LocalizedTextResponseDTO,
    description: "Alternative text describing the photo",
  })
  alt!: LocalizedTextResponseDTO;
  @ApiProperty({ description: "Order in the gallery" }) position!: number;
  static from(
    facilityId: string,
    value: {
      id: string;
      version: string;
      alt: { gl: string; es: string };
      position?: number;
    },
  ): FacilityPhotoResponseDTO {
    return {
      id: value.id,
      url: `/v2/public/facilities/${facilityId}/photos/${value.id}?v=${value.version}`,
      alt: { gl: value.alt.gl, es: value.alt.es },
      position: value.position ?? 0,
    };
  }
}
