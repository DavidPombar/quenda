// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { BookingReadModel } from "../../../domain/booking.read-model";
export class BookingHistoryResponseDTO {
  @ApiProperty({ description: "Booking UUID" }) id!: string;
  @ApiProperty({ description: "Facility UUID" }) facilityId!: string;
  @ApiProperty({ description: "Start instant" }) start!: string;
  @ApiProperty({ description: "End instant" }) end!: string;
  @ApiProperty({ description: "Booking state" }) status!:
    "confirmed" | "cancelled";
  @ApiProperty({ description: "Facility display name" }) facilityName!: string;
  @ApiProperty({ description: "Sport" }) sport!: string;
  static from(value: BookingReadModel): BookingHistoryResponseDTO {
    return {
      id: value.booking.id,
      facilityId: value.booking.facilityId,
      start: value.booking.start.toString(),
      end: value.booking.end.toString(),
      status: value.booking.status,
      facilityName: value.facilityName,
      sport: value.sport,
    };
  }
}
