// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { ExportedBooking } from "../../../domain/account.read-model";
export class ExportedBookingResponseDTO {
  @ApiProperty({ description: "Booking UUID" }) id!: string;
  @ApiProperty({ description: "Facility UUID" }) facilityId!: string;
  @ApiProperty({ description: "Facility display name" }) facilityName!: string;
  @ApiProperty({ description: "Sport" }) sport!: string;
  @ApiProperty({ description: "Start instant" }) start!: string;
  @ApiProperty({ description: "End instant" }) end!: string;
  @ApiProperty({
    enum: ["confirmed", "cancelled", "no_show"],
    description: "Booking state",
  })
  status!: ExportedBooking["status"];
  @ApiProperty({ description: "Creation instant" }) createdAt!: string;
  @ApiProperty({ description: "Cancellation instant", nullable: true })
  cancelledAt!: string | null;
  @ApiProperty({
    enum: ["citizen", "municipality"],
    nullable: true,
    description: "Who cancelled",
  })
  cancelledBy!: ExportedBooking["cancelledBy"];
  @ApiProperty({
    type: String,
    nullable: true,
    description: "Municipal reason",
  })
  cancellationReason!: string | null;
  @ApiProperty({
    type: String,
    nullable: true,
    description: "Instant access staff recorded the entry",
  })
  checkedInAt!: string | null;
  static from(value: ExportedBooking): ExportedBookingResponseDTO {
    return {
      id: value.id,
      facilityId: value.facilityId,
      facilityName: value.facilityName,
      sport: value.sport,
      start: value.start.toString(),
      end: value.end.toString(),
      status: value.status,
      createdAt: value.createdAt.toString(),
      cancelledAt: value.cancelledAt ? value.cancelledAt.toString() : null,
      cancelledBy: value.cancelledBy,
      cancellationReason: value.cancellationReason,
      checkedInAt: value.checkedInAt?.toString() ?? null,
    };
  }
}
