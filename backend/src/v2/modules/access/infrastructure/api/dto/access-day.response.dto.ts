// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import {
  AccessDay,
  AccessDayBooking,
  AccessDayParticipant,
  AccessDaySession,
} from "../../../domain/access.read-model";
export class AccessDayBookingResponseDTO {
  @ApiProperty({ description: "Reservation revision" }) sequence!: number;
  @ApiProperty({ description: "Earliest permitted entry instant" })
  validFrom!: string;
  @ApiProperty({ description: "Reservation UUID" }) id!: string;
  @ApiProperty({ description: "Short code shown with the QR" }) code!: string;
  @ApiProperty({ description: "Facility UUID" }) facilityId!: string;
  @ApiProperty({ description: "Facility name" }) facilityName!: string;
  @ApiProperty({ description: "Start instant" }) start!: string;
  @ApiProperty({ description: "End instant" }) end!: string;
  @ApiProperty({ enum: ["confirmed", "cancelled", "no_show"] })
  status!: AccessDayBooking["status"];
  @ApiProperty({ description: "First name of the person who booked" })
  holder!: string;
  @ApiProperty({
    type: String,
    nullable: true,
    description: "Check-in instant",
  })
  checkedInAt!: string | null;
  static from(value: AccessDayBooking): AccessDayBookingResponseDTO {
    return {
      id: value.id,
      sequence: value.sequence,
      validFrom: value.validFrom.toString(),
      code: value.code,
      facilityId: value.facilityId,
      facilityName: value.facilityName,
      start: value.start.toString(),
      end: value.end.toString(),
      status: value.status,
      holder: value.holder,
      checkedInAt: value.checkedInAt?.toString() ?? null,
    };
  }
}
export class AccessDayParticipantResponseDTO {
  @ApiProperty() enrolmentId!: string;
  @ApiProperty({ description: "First name only" }) name!: string;
  @ApiProperty({ enum: ["present", "absent"], nullable: true, type: String })
  attendance!: AccessDayParticipant["attendance"];
}
export class AccessDaySessionNameDTO {
  @ApiProperty() gl!: string;
  @ApiProperty({ description: "Empty means use the Galician text" })
  es!: string;
}
export class AccessDaySessionResponseDTO {
  @ApiProperty({ description: "Session UUID" }) id!: string;
  @ApiProperty() activityId!: string;
  @ApiProperty({ type: AccessDaySessionNameDTO })
  activityName!: AccessDaySessionNameDTO;
  @ApiProperty() facilityId!: string;
  @ApiProperty() facilityName!: string;
  @ApiProperty() resourceName!: string;
  @ApiProperty() start!: string;
  @ApiProperty() end!: string;
  @ApiProperty({ description: "When the roll can be taken" })
  validFrom!: string;
  @ApiProperty({ type: [AccessDayParticipantResponseDTO] })
  people!: AccessDayParticipantResponseDTO[];
  static from(value: AccessDaySession): AccessDaySessionResponseDTO {
    return {
      ...value,
      start: value.start.toString(),
      end: value.end.toString(),
      validFrom: value.validFrom.toString(),
    };
  }
}
export class AccessDayResponseDTO {
  @ApiProperty({ description: "Local date (YYYY-MM-DD)" }) date!: string;
  @ApiProperty({ description: "Server instant of this snapshot" })
  syncedAt!: string;
  @ApiProperty({ description: "Expected iss claim (municipality slug)" })
  issuer!: string;
  @ApiProperty({
    description: "Public keys to verify passes offline (JWK)",
    type: Object,
    isArray: true,
  })
  keys!: Record<string, string>[];
  @ApiProperty({ type: [AccessDayBookingResponseDTO] })
  bookings!: AccessDayBookingResponseDTO[];
  @ApiProperty({
    type: [AccessDaySessionResponseDTO],
    description: "Activity sessions of the day with their roll (#97)",
  })
  sessions!: AccessDaySessionResponseDTO[];
  @ApiProperty({
    description: "Reservations whose passes must be rejected",
    type: [String],
  })
  revoked!: string[];
  static from(value: AccessDay): AccessDayResponseDTO {
    return {
      date: value.date.toString(),
      syncedAt: value.syncedAt.toString(),
      issuer: value.issuer,
      keys: value.keys.map((key) => key.publicJwk),
      bookings: value.bookings.map(AccessDayBookingResponseDTO.from),
      sessions: value.sessions.map(AccessDaySessionResponseDTO.from),
      revoked: value.revoked,
    };
  }
}
