// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { AccessDay, AccessDayBooking } from "../../../domain/access.read-model";
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
      revoked: value.revoked,
    };
  }
}
