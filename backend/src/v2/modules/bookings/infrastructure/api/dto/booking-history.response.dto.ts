// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { BookingReadModel } from "../../../domain/booking.read-model";
export class BookingHistoryResponseDTO {
  @ApiProperty({ description: "Booking UUID" }) id!: string;
  @ApiProperty({ description: "Facility UUID" }) facilityId!: string;
  @ApiProperty({ description: "Booked resource UUID" }) resourceId!: string;
  @ApiProperty({ description: "Start instant" }) start!: string;
  @ApiProperty({ description: "End instant" }) end!: string;
  @ApiProperty({ description: "Booking state" }) status!:
    "confirmed" | "cancelled";
  @ApiProperty({ description: "Facility display name" }) facilityName!: string;
  @ApiProperty({ description: "Court or space display name" })
  resourceName!: string;
  @ApiProperty({ description: "Sport" }) sport!: string;
  static from(value: BookingReadModel): BookingHistoryResponseDTO {
    return {
      id: value.booking.id,
      facilityId: value.booking.facilityId,
      resourceId: value.booking.resourceId,
      start: value.booking.start.toString(),
      end: value.booking.end.toString(),
      status: value.booking.status,
      facilityName: value.facilityName,
      resourceName: value.resourceName,
      sport: value.sport,
    };
  }
}
