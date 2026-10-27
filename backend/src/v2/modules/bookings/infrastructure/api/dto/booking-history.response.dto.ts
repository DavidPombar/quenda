// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { BookingReadModel } from "../../../domain/booking.read-model";
import type { Booking, BookingOutcome } from "../../../domain/booking.entity";
export class BookingHistoryResponseDTO {
  @ApiProperty({ description: "Booking UUID" }) id!: string;
  @ApiProperty({ description: "Facility UUID" }) facilityId!: string;
  @ApiProperty({ description: "Booked resource UUID" }) resourceId!: string;
  @ApiProperty({ description: "Start instant" }) start!: string;
  @ApiProperty({ description: "End instant" }) end!: string;
  @ApiProperty({
    enum: ["confirmed", "cancelled", "no_show"],
    description: "Stored booking state",
  })
  status!: Booking["status"];
  @ApiProperty({
    enum: ["upcoming", "attended", "no_show", "cancelled"],
    description:
      "Outcome; a confirmed booking that has ended counts as attended",
  })
  outcome!: BookingOutcome;
  @ApiProperty({
    enum: ["citizen", "municipality"],
    nullable: true,
    description: "Who cancelled the booking",
  })
  cancelledBy!: "citizen" | "municipality" | null;
  @ApiProperty({
    type: String,
    nullable: true,
    description: "Reason given by the municipality",
  })
  cancellationReason!: string | null;
  @ApiProperty({ description: "Facility display name" }) facilityName!: string;
  @ApiProperty({ description: "Court or space display name" })
  resourceName!: string;
  @ApiProperty({ description: "Sport" }) sport!: string;
  static from(
    value: BookingReadModel & { outcome: BookingOutcome },
  ): BookingHistoryResponseDTO {
    const { booking } = value;
    return {
      id: booking.id,
      facilityId: booking.facilityId,
      resourceId: booking.resourceId,
      start: booking.start.toString(),
      end: booking.end.toString(),
      status: booking.status,
      outcome: value.outcome,
      cancelledBy: booking.status === "cancelled" ? booking.cancelledBy : null,
      cancellationReason:
        booking.status === "cancelled" ? booking.cancellationReason : null,
      facilityName: value.facilityName,
      resourceName: value.resourceName,
      sport: value.sport,
    };
  }
}
