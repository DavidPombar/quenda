// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import {
  AccessibilityMethod,
  AccessibilitySettings,
  MunicipalitySettings,
} from "../../../../../shared/application/municipality-settings";
export class AccessibilityExceptionsResponseDTO {
  @ApiProperty({ description: "Non-accessible content in Galician" })
  gl!: string;
  @ApiProperty({ description: "Non-accessible content in Spanish" })
  es!: string;
}
export class AccessibilityResponseDTO {
  @ApiProperty({ description: "Unit responsible for accessibility" })
  unit!: string;
  @ApiProperty({ description: "Contact address for accessibility requests" })
  email!: string;
  @ApiProperty({ description: "Contact phone for accessibility requests" })
  phone!: string;
  @ApiProperty({ description: "Last statement review (YYYY-MM-DD)" })
  reviewedOn!: string;
  @ApiProperty({
    enum: ["self", "external"],
    description: "Self-assessment or external audit",
  })
  method!: AccessibilityMethod;
  @ApiProperty({ type: AccessibilityExceptionsResponseDTO })
  exceptions!: AccessibilityExceptionsResponseDTO;
  static from(value: AccessibilitySettings): AccessibilityResponseDTO {
    return {
      unit: value.unit,
      email: value.email,
      phone: value.phone,
      reviewedOn: value.reviewedOn,
      method: value.method,
      exceptions: { gl: value.exceptions.gl, es: value.exceptions.es },
    };
  }
}
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
    type: AccessibilityResponseDTO,
    description: "Accessibility statement data (RD 1112/2018)",
  })
  accessibility!: AccessibilityResponseDTO;
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
      accessibility: AccessibilityResponseDTO.from(value.accessibility),
    };
  }
}
