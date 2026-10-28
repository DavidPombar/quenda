// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { CheckInOutcome } from "../../../domain/access.read-model";
export class CheckInResultResponseDTO {
  @ApiProperty({ description: "Reservation UUID" }) bookingId!: string;
  @ApiProperty({
    enum: [
      "recorded",
      "duplicate",
      "cancelled",
      "no_show",
      "out_of_window",
      "not_found",
      "stale",
    ],
  })
  outcome!: CheckInOutcome;
}
export class CheckInsResponseDTO {
  @ApiProperty({ type: [CheckInResultResponseDTO] })
  results!: CheckInResultResponseDTO[];
}
