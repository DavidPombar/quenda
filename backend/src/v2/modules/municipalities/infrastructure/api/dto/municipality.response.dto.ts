// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import {
  MunicipalityLocale,
  MunicipalitySettings,
} from "../../../../../shared/application/municipality-settings";
export class LegalTextsDTO {
  @ApiProperty({ description: "Privacy notice in Galician" }) gl!: string;
  @ApiProperty({ description: "Privacy notice in Spanish" }) es!: string;
}
export class MunicipalityResponseDTO {
  @ApiProperty({ description: "Municipality UUID" }) id!: string;
  @ApiProperty({ description: "Public municipality identifier" }) slug!: string;
  @ApiProperty({ description: "Municipality name" }) name!: string;
  @ApiProperty({ description: "IANA time zone" }) timezone!: string;
  @ApiProperty({
    enum: ["gl", "es"],
    description: "Default language; a person's own choice takes precedence",
  })
  locale!: MunicipalityLocale;
  @ApiProperty({ description: "Booking horizon in local calendar days" })
  advanceDays!: number;
  @ApiProperty({
    description:
      "Hours required before changing or cancelling new reservations",
  })
  cancellationHours!: number;
  @ApiProperty({ description: "Maximum upcoming reservations per person" })
  maxActiveBookings!: number;
  @ApiProperty({ description: "Municipal contact address" }) contact!: string;
  @ApiProperty({
    type: LegalTextsDTO,
    description: "Current privacy notice in each language",
  })
  legalTexts!: LegalTextsDTO;
  @ApiProperty({
    description: "Privacy notice version citizens must accept when signing in",
  })
  legalVersion!: string;
  @ApiProperty({ description: "Personal data retention period in months" })
  retentionMonths!: number;
  @ApiProperty({
    description: "Brand colour (#rrggbb) with at least 4.5:1 contrast on white",
  })
  primaryColor!: string;
  @ApiProperty({
    type: String,
    nullable: true,
    description: "Versioned logo URL, or null when none was uploaded",
  })
  logoUrl!: string | null;
  static from(value: MunicipalitySettings): MunicipalityResponseDTO {
    return {
      id: value.id,
      slug: value.slug,
      name: value.name,
      timezone: value.timezone,
      locale: value.locale,
      advanceDays: value.advanceDays,
      cancellationHours: value.cancellationHours,
      maxActiveBookings: value.maxActiveBookings,
      contact: value.contact,
      legalTexts: { gl: value.legalTexts.gl, es: value.legalTexts.es },
      legalVersion: value.legalVersion,
      retentionMonths: value.retentionMonths,
      primaryColor: value.primaryColor,
      logoUrl: value.logoVersion
        ? `/v2/public/municipalities/${value.slug}/logo?v=${value.logoVersion}`
        : null,
    };
  }
}
