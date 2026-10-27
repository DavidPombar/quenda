// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { MunicipalitySettings } from "../../../../../shared/application/municipality-settings";
export class MunicipalityResponseDTO {
  @ApiProperty({ description: "Municipality UUID" }) id!: string;
  @ApiProperty({ description: "Public municipality identifier" }) slug!: string;
  @ApiProperty({ description: "Municipality name" }) name!: string;
  @ApiProperty({ description: "IANA time zone" }) timezone!: string;
  @ApiProperty({ description: "Default language" }) locale!: string;
  @ApiProperty({ description: "Booking horizon in local calendar days" })
  advanceDays!: number;
  @ApiProperty({ description: "Hours required before changing or cancelling" })
  cancellationHours!: number;
  @ApiProperty({ description: "Maximum upcoming reservations per person" })
  maxActiveBookings!: number;
  @ApiProperty({ description: "Municipal contact address" }) contact!: string;
  @ApiProperty({ description: "Municipal privacy notice" }) legalText!: string;
  @ApiProperty({
    description: "Privacy notice version citizens must accept when signing in",
  })
  legalVersion!: string;
  @ApiProperty({ description: "Personal data retention period in months" })
  retentionMonths!: number;
  @ApiProperty({
    description: "Hours before a reservation its reminder is sent",
  })
  reminderHours!: number;
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
      legalText: value.legalText,
      legalVersion: value.legalVersion,
      retentionMonths: value.retentionMonths,
      reminderHours: value.reminderHours,
    };
  }
}
