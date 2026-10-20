// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { MunicipalityExport } from "../../../domain/municipality-snapshot.read-model";
export const EXPORT_FORMAT = "quenda-municipality-export";
export const EXPORT_VERSION = 1;
class ExportedMunicipalityDTO {
  @ApiProperty() id!: string;
  @ApiProperty() slug!: string;
  @ApiProperty() name!: string;
  @ApiProperty({ description: "IANA time zone" }) timezone!: string;
  @ApiProperty({ description: "Default language (gl or es)" }) locale!: string;
  @ApiProperty() advanceDays!: number;
  @ApiProperty() cancellationHours!: number;
  @ApiProperty() maxActiveBookings!: number;
  @ApiProperty() contact!: string;
  @ApiProperty() legalText!: string;
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
  @ApiProperty({ description: "RFC 5545 VCALENDAR, verbatim" })
  openingCalendar!: string;
  @ApiProperty() rules!: string;
}
class ExportedUserDTO {
  @ApiProperty() id!: string;
  @ApiProperty() displayName!: string;
  @ApiProperty({ enum: ["citizen", "manager"] }) role!: string;
}
class ExportedBookingDTO {
  @ApiProperty() id!: string;
  @ApiProperty() userId!: string;
  @ApiProperty() facilityId!: string;
  @ApiProperty({ description: "ISO 8601 instant" }) start!: string;
  @ApiProperty({ description: "ISO 8601 instant" }) end!: string;
  @ApiProperty({ enum: ["confirmed", "cancelled"] }) status!: string;
  @ApiProperty() createdAt!: string;
  @ApiProperty({ type: String, nullable: true }) cancelledAt!: string | null;
}
class ExportedNotificationDTO {
  @ApiProperty() id!: string;
  @ApiProperty() userId!: string;
  @ApiProperty() bookingId!: string;
  @ApiProperty() kind!: string;
  @ApiProperty() createdAt!: string;
}
class ExportedAuditEventDTO {
  @ApiProperty() id!: string;
  @ApiProperty() actorId!: string;
  @ApiProperty() action!: string;
  @ApiProperty() resourceId!: string;
  @ApiProperty() occurredAt!: string;
}
export class MunicipalityExportResponseDTO {
  @ApiProperty({ enum: [EXPORT_FORMAT] }) format!: typeof EXPORT_FORMAT;
  @ApiProperty({
    enum: [EXPORT_VERSION],
    description: "Package version; see docs/architecture/data-portability.md",
  })
  version!: typeof EXPORT_VERSION;
  @ApiProperty({ description: "ISO 8601 instant" }) exportedAt!: string;
  @ApiProperty({ type: ExportedMunicipalityDTO })
  municipality!: ExportedMunicipalityDTO;
  @ApiProperty({ type: [ExportedFacilityDTO] })
  facilities!: ExportedFacilityDTO[];
  @ApiProperty({ type: [ExportedUserDTO] }) users!: ExportedUserDTO[];
  @ApiProperty({ type: [ExportedBookingDTO] }) bookings!: ExportedBookingDTO[];
  @ApiProperty({ type: [ExportedNotificationDTO] })
  notifications!: ExportedNotificationDTO[];
  @ApiProperty({ type: [ExportedAuditEventDTO] })
  auditEvents!: ExportedAuditEventDTO[];
  static from(value: MunicipalityExport): MunicipalityExportResponseDTO {
    const { snapshot } = value;
    return {
      format: EXPORT_FORMAT,
      version: EXPORT_VERSION,
      exportedAt: value.exportedAt.toString(),
      municipality: { ...snapshot.municipality },
      facilities: snapshot.facilities.map((facility) => ({ ...facility })),
      users: snapshot.users.map((user) => ({ ...user })),
      bookings: snapshot.bookings.map((booking) => ({
        ...booking,
        start: booking.start.toString(),
        end: booking.end.toString(),
        createdAt: booking.createdAt.toString(),
        cancelledAt: booking.cancelledAt?.toString() ?? null,
      })),
      notifications: snapshot.notifications.map((notification) => ({
        ...notification,
        createdAt: notification.createdAt.toString(),
      })),
      auditEvents: snapshot.auditEvents.map((event) => ({
        ...event,
        occurredAt: event.occurredAt.toString(),
      })),
    };
  }
}
