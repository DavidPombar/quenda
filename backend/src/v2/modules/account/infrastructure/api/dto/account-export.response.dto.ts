// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { AccountExport } from "../../../domain/account.read-model";
import { ExportedProfileResponseDTO } from "./exported-profile.response.dto";
import { ExportedIdentityResponseDTO } from "./exported-identity.response.dto";
import { ConsentResponseDTO } from "./consent.response.dto";
import { ExportMunicipalityResponseDTO } from "./export-municipality.response.dto";
import { ExportedCategoryResponseDTO } from "./exported-category.response.dto";
import { ExportedBookingResponseDTO } from "./exported-booking.response.dto";
import { ExportedNotificationResponseDTO } from "./exported-notification.response.dto";
import { ExportedAuditEventResponseDTO } from "./exported-audit-event.response.dto";
import { ExportedMessageResponseDTO } from "./exported-message.response.dto";
import { NoticePreferencesResponseDTO } from "./notice-preferences.response.dto";
import { ExportedPushDeviceResponseDTO } from "./exported-push-device.response.dto";
import { ExportedBlockResponseDTO } from "./exported-block.response.dto";
export class AccountExportResponseDTO {
  @ApiProperty({ description: "Instant the export was produced" })
  generatedAt!: string;
  @ApiProperty({
    description: "Municipality responsible for the data",
    type: ExportMunicipalityResponseDTO,
  })
  municipality!: ExportMunicipalityResponseDTO;
  @ApiProperty({
    description: "Account profile with the personal data stored on it",
    type: ExportedProfileResponseDTO,
  })
  profile!: ExportedProfileResponseDTO;
  @ApiProperty({
    description:
      "External identities (eID issuer and subject) linked to the account",
    type: [ExportedIdentityResponseDTO],
  })
  identities!: ExportedIdentityResponseDTO[];
  @ApiProperty({
    description: "Accepted privacy notice versions",
    type: [ConsentResponseDTO],
  })
  consents!: ConsentResponseDTO[];
  @ApiProperty({
    description: "User categories requested or assigned (M2)",
    type: [ExportedCategoryResponseDTO],
  })
  categories!: ExportedCategoryResponseDTO[];
  @ApiProperty({
    description: "Whether the family tariff is preferred over the lowest one",
  })
  prefersFamilyTariff!: boolean;
  @ApiProperty({
    description: "Every reservation on record, without paging",
    type: [ExportedBookingResponseDTO],
  })
  bookings!: ExportedBookingResponseDTO[];
  @ApiProperty({
    description: "Every notice on record, without paging",
    type: [ExportedNotificationResponseDTO],
  })
  notifications!: ExportedNotificationResponseDTO[];
  @ApiProperty({
    description: "Notice choices per kind and channel",
    type: NoticePreferencesResponseDTO,
  })
  preferences!: NoticePreferencesResponseDTO;
  @ApiProperty({
    description: "Devices receiving push notices, without their credentials",
    type: [ExportedPushDeviceResponseDTO],
  })
  pushDevices!: ExportedPushDeviceResponseDTO[];
  @ApiProperty({
    description:
      "Email, push and access-control messages queued or delivered (without their text)",
    type: [ExportedMessageResponseDTO],
  })
  messages!: ExportedMessageResponseDTO[];
  @ApiProperty({
    description: "Booking bans after repeated no-shows",
    type: [ExportedBlockResponseDTO],
  })
  blocks!: ExportedBlockResponseDTO[];
  @ApiProperty({
    description: "Audit events performed by this account",
    type: [ExportedAuditEventResponseDTO],
  })
  auditEvents!: ExportedAuditEventResponseDTO[];
  static from(value: AccountExport): AccountExportResponseDTO {
    return {
      generatedAt: value.generatedAt.toString(),
      municipality: ExportMunicipalityResponseDTO.from(value.municipality),
      profile: ExportedProfileResponseDTO.from(value.profile),
      identities: value.identities.map(ExportedIdentityResponseDTO.from),
      consents: value.consents.map(ConsentResponseDTO.from),
      categories: value.categories.map(ExportedCategoryResponseDTO.from),
      prefersFamilyTariff: value.prefersFamilyTariff,
      bookings: value.bookings.map(ExportedBookingResponseDTO.from),
      notifications: value.notifications.map(
        ExportedNotificationResponseDTO.from,
      ),
      preferences: NoticePreferencesResponseDTO.from(value.preferences),
      pushDevices: value.pushDevices.map(ExportedPushDeviceResponseDTO.from),
      messages: value.messages.map(ExportedMessageResponseDTO.from),
      blocks: value.blocks.map(ExportedBlockResponseDTO.from),
      auditEvents: value.auditEvents.map(ExportedAuditEventResponseDTO.from),
    };
  }
}
