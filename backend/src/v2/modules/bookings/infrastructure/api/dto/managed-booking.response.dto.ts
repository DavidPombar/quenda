// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { ManagedBooking } from "../../../application/queries/list-managed-bookings.query";
import { BookingHistoryResponseDTO } from "./booking-history.response.dto";
export class ManagedBookingResponseDTO extends BookingHistoryResponseDTO {
  @ApiProperty({ description: "Display name of the person" })
  displayName!: string;
  @ApiProperty({
    type: String,
    nullable: true,
    description: "When the person's QR was scanned at the door (M3)",
  })
  checkedInAt!: string | null;
  @ApiProperty({
    description: "Started today, still confirmed and not checked in",
  })
  canMarkNoShow!: boolean;
  @ApiProperty({ description: "Marked as no-show; can be reverted any time" })
  canRevert!: boolean;
  @ApiProperty({ description: "Confirmed and not started yet" })
  canCancel!: boolean;
  static fromManaged(value: ManagedBooking): ManagedBookingResponseDTO {
    return {
      ...BookingHistoryResponseDTO.from(value),
      displayName: value.displayName,
      checkedInAt: value.checkedInAt?.toString() ?? null,
      canMarkNoShow: value.canMarkNoShow,
      canRevert: value.canRevert,
      canCancel: value.canCancel,
    };
  }
}
