// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { CheckInResult } from "../../../application/commands/check-in.command";
export class CheckInResponseDTO {
  @ApiProperty() bookingId!: string;
  @ApiProperty() facilityId!: string;
  @ApiProperty() facilityName!: string;
  @ApiProperty({ description: "Display name, so staff can greet the person" })
  displayName!: string;
  @ApiProperty() start!: string;
  @ApiProperty() end!: string;
  @ApiProperty() checkedInAt!: string;
  @ApiProperty({ description: "The booking had already been checked in" })
  alreadyCheckedIn!: boolean;
  static from(value: CheckInResult): CheckInResponseDTO {
    return {
      bookingId: value.booking.id,
      facilityId: value.booking.facilityId,
      facilityName: value.booking.facilityName,
      displayName: value.booking.displayName,
      start: value.booking.start.toString(),
      end: value.booking.end.toString(),
      checkedInAt: value.checkedInAt.toString(),
      alreadyCheckedIn: value.alreadyCheckedIn,
    };
  }
}
