// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { MunicipalityExport } from "../../../domain/municipality-snapshot.read-model";
export const EXPORT_FORMAT = "quenda-municipality-export";
export const EXPORT_VERSION = 2;
class ExportedMunicipalityDTO {
  @ApiProperty() id!: string;
  @ApiProperty() slug!: string;
  @ApiProperty() name!: string;
  @ApiProperty() timezone!: string;
  @ApiProperty() locale!: string;
  @ApiProperty() advanceDays!: number;
  @ApiProperty() cancellationHours!: number;
  @ApiProperty() maxActiveBookings!: number;
  @ApiProperty() contact!: string;
  @ApiProperty() legalText!: string;
  @ApiProperty() legalVersion!: string;
  @ApiProperty() retentionMonths!: number;
  @ApiProperty() primaryColor!: string;
  @ApiProperty() holidaysCalendar!: string;
  @ApiProperty() noShowLimit!: number;
  @ApiProperty() noShowWindowDays!: number;
  @ApiProperty() noShowBlockDays!: number;
  @ApiProperty() reminderHours!: number;
  @ApiProperty() mailSenderName!: string;
  @ApiProperty() mailReplyTo!: string;
  @ApiProperty({ description: "SPDX licence of the open data" })
  dataLicense!: string;
  @ApiProperty({ type: String, nullable: true }) dir3Code!: string | null;
}
class ExportedFacilityDTO {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() sport!: string;
  @ApiProperty() address!: string;
  @ApiProperty() description!: string;
  @ApiProperty() accessible!: boolean;
  @ApiProperty() status!: string;
  @ApiProperty() slotMinutes!: number;
  @ApiProperty() priceCents!: number;
  @ApiProperty() openingCalendar!: string;
  @ApiProperty() rules!: string;
  @ApiProperty() followsMunicipalHolidays!: boolean;
  @ApiProperty({ type: Number, nullable: true }) latitude!: number | null;
  @ApiProperty({ type: Number, nullable: true }) longitude!: number | null;
}
class ExportedResourceDTO {
  @ApiProperty() id!: string;
  @ApiProperty() facilityId!: string;
  @ApiProperty() name!: string;
  @ApiProperty() position!: number;
  @ApiProperty({
    type: String,
    nullable: true,
    description: "Whole court this resource is a part of",
  })
  parentId!: string | null;
  @ApiProperty() active!: boolean;
  @ApiProperty({ type: String, format: "date-time" }) createdAt!: string;
}
class ExportedUserDTO {
  @ApiProperty() id!: string;
  @ApiProperty() displayName!: string;
  @ApiProperty() role!: string;
  @ApiProperty({ type: String, format: "date-time", nullable: true })
  deletedAt!: string | null;
  @ApiProperty({ type: String, nullable: true }) email!: string | null;
  @ApiProperty({ type: String, nullable: true }) locale!: string | null;
}
class ExportedBookingDTO {
  @ApiProperty() id!: string;
  @ApiProperty({ type: String, nullable: true }) userId!: string | null;
  @ApiProperty() facilityId!: string;
  @ApiProperty({ description: "Booked court or space" }) resourceId!: string;
  @ApiProperty({ type: String, format: "date-time" }) start!: string;
  @ApiProperty({ type: String, format: "date-time" }) end!: string;
  @ApiProperty() status!: string;
  @ApiProperty({ type: String, format: "date-time" }) createdAt!: string;
  @ApiProperty({ type: String, format: "date-time", nullable: true })
  cancelledAt!: string | null;
  @ApiProperty({ type: Number, nullable: true }) cancellationHours!:
    number | null;
  @ApiProperty({ type: String, nullable: true }) cancelledBy!: string | null;
  @ApiProperty({ type: String, nullable: true }) cancellationReason!:
    string | null;
  @ApiProperty() sequence!: number;
}
class ExportedNotificationDTO {
  @ApiProperty() id!: string;
  @ApiProperty() userId!: string;
  @ApiProperty() bookingId!: string;
  @ApiProperty() kind!: string;
  @ApiProperty({ type: String, format: "date-time" }) createdAt!: string;
  @ApiProperty({ type: Object, additionalProperties: true, nullable: true })
  details!: Record<string, unknown> | null;
}
class ExportedAuditEventDTO {
  @ApiProperty() id!: string;
  @ApiProperty({ type: String, nullable: true }) actorId!: string | null;
  @ApiProperty() action!: string;
  @ApiProperty() resourceId!: string;
  @ApiProperty({ type: String, format: "date-time" }) occurredAt!: string;
  @ApiProperty({ type: String, nullable: true }) actorRole!: string | null;
  @ApiProperty({ type: Object, additionalProperties: true, nullable: true })
  details!: Record<string, unknown> | null;
}
class ExportedConsentDTO {
  @ApiProperty() id!: string;
  @ApiProperty() userId!: string;
  @ApiProperty() legalVersion!: string;
  @ApiProperty({ type: String, format: "date-time" }) acceptedAt!: string;
}
class ExportedLegalTextDTO {
  @ApiProperty() version!: string;
  @ApiProperty() textGl!: string;
  @ApiProperty() textEs!: string;
  @ApiProperty({ type: String, format: "date-time" }) publishedAt!: string;
}
class ExportedLogoDTO {
  @ApiProperty() contentType!: string;
  @ApiProperty({ description: "Base64 encoded image bytes" }) data!: string;
  @ApiProperty() sha256!: string;
  @ApiProperty({ type: String, format: "date-time" }) updatedAt!: string;
}
class ExportedBookingBlockDTO {
  @ApiProperty() id!: string;
  @ApiProperty() userId!: string;
  @ApiProperty() bookingId!: string;
  @ApiProperty({ type: String, format: "date-time" }) start!: string;
  @ApiProperty({ type: String, format: "date-time" }) end!: string;
  @ApiProperty({ type: String, format: "date-time", nullable: true })
  liftedAt!: string | null;
}
class ExportedNotificationPreferenceDTO {
  @ApiProperty() userId!: string;
  @ApiProperty() kind!: string;
  @ApiProperty() channel!: string;
  @ApiProperty() enabled!: boolean;
  @ApiProperty({ type: String, format: "date-time" }) updatedAt!: string;
}
class ExportedMessageDTO {
  @ApiProperty() id!: string;
  @ApiProperty() userId!: string;
  @ApiProperty() bookingId!: string;
  @ApiProperty() kind!: string;
  @ApiProperty() channel!: string;
  @ApiProperty() dedupeKey!: string;
  @ApiProperty({ type: String, format: "date-time" }) createdAt!: string;
  @ApiProperty({ type: String, format: "date-time" }) availableAt!: string;
  @ApiProperty() attempts!: number;
  @ApiProperty({ type: String, format: "date-time", nullable: true })
  lockedUntil!: string | null;
  @ApiProperty({ type: String, format: "date-time", nullable: true }) sentAt!:
    string | null;
  @ApiProperty({ type: String, nullable: true }) lastError!: string | null;
}
export class MunicipalityExportResponseDTO {
  @ApiProperty({ enum: [EXPORT_FORMAT] }) format!: typeof EXPORT_FORMAT;
  @ApiProperty({ enum: [EXPORT_VERSION] }) version!: typeof EXPORT_VERSION;
  @ApiProperty({ format: "date-time" }) exportedAt!: string;
  @ApiProperty({ type: ExportedMunicipalityDTO })
  municipality!: ExportedMunicipalityDTO;
  @ApiProperty({ type: [ExportedFacilityDTO] })
  facilities!: ExportedFacilityDTO[];
  @ApiProperty({
    type: [ExportedResourceDTO],
    description: "Courts and spaces, parents before their parts",
  })
  resources!: ExportedResourceDTO[];
  @ApiProperty({ type: [ExportedUserDTO] }) users!: ExportedUserDTO[];
  @ApiProperty({ type: [ExportedBookingDTO] }) bookings!: ExportedBookingDTO[];
  @ApiProperty({ type: [ExportedNotificationDTO] })
  notifications!: ExportedNotificationDTO[];
  @ApiProperty({ type: [ExportedAuditEventDTO] })
  auditEvents!: ExportedAuditEventDTO[];
  @ApiProperty({ type: [ExportedConsentDTO] }) consents!: ExportedConsentDTO[];
  @ApiProperty({ type: [ExportedLegalTextDTO] })
  legalTexts!: ExportedLegalTextDTO[];
  @ApiProperty({ type: [ExportedLogoDTO] }) logos!: ExportedLogoDTO[];
  @ApiProperty({ type: [ExportedBookingBlockDTO] })
  bookingBlocks!: ExportedBookingBlockDTO[];
  @ApiProperty({ type: [ExportedNotificationPreferenceDTO] })
  notificationPreferences!: ExportedNotificationPreferenceDTO[];
  @ApiProperty({ type: [ExportedMessageDTO] }) messages!: ExportedMessageDTO[];
  static from(value: MunicipalityExport): MunicipalityExportResponseDTO {
    const { snapshot } = value;
    return {
      format: EXPORT_FORMAT,
      version: EXPORT_VERSION,
      exportedAt: value.exportedAt.toString(),
      municipality: snapshot.municipality,
      facilities: snapshot.facilities,
      resources: snapshot.resources.map((value) => ({
        ...value,
        createdAt: value.createdAt.toString(),
      })),
      users: snapshot.users.map((value) => ({
        ...value,
        deletedAt: value.deletedAt?.toString() ?? null,
      })),
      bookings: snapshot.bookings.map((value) => ({
        ...value,
        start: value.start.toString(),
        end: value.end.toString(),
        createdAt: value.createdAt.toString(),
        cancelledAt: value.cancelledAt?.toString() ?? null,
      })),
      notifications: snapshot.notifications.map((value) => ({
        ...value,
        createdAt: value.createdAt.toString(),
      })),
      auditEvents: snapshot.auditEvents.map((value) => ({
        ...value,
        occurredAt: value.occurredAt.toString(),
      })),
      consents: snapshot.consents.map((value) => ({
        ...value,
        acceptedAt: value.acceptedAt.toString(),
      })),
      legalTexts: snapshot.legalTexts.map((value) => ({
        ...value,
        publishedAt: value.publishedAt.toString(),
      })),
      logos: snapshot.logos.map((value) => ({
        ...value,
        updatedAt: value.updatedAt.toString(),
      })),
      bookingBlocks: snapshot.bookingBlocks.map((value) => ({
        ...value,
        start: value.start.toString(),
        end: value.end.toString(),
        liftedAt: value.liftedAt?.toString() ?? null,
      })),
      notificationPreferences: snapshot.notificationPreferences.map(
        (value) => ({ ...value, updatedAt: value.updatedAt.toString() }),
      ),
      messages: snapshot.messages.map((value) => ({
        ...value,
        createdAt: value.createdAt.toString(),
        availableAt: value.availableAt.toString(),
        lockedUntil: value.lockedUntil?.toString() ?? null,
        sentAt: value.sentAt?.toString() ?? null,
      })),
    };
  }
}
