// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { AttendanceOutcome } from "../../../domain/access.read-model";
export class AttendanceResultResponseDTO {
  @ApiProperty() sessionId!: string;
  @ApiProperty() enrolmentId!: string;
  @ApiProperty({
    enum: [
      "recorded",
      "stale",
      "cancelled",
      "not_enrolled",
      "out_of_window",
      "not_found",
    ],
    description:
      "`stale`: a later mark for that person and session was already kept",
  })
  outcome!: AttendanceOutcome;
}
export class AttendanceResponseDTO {
  @ApiProperty({ type: [AttendanceResultResponseDTO] })
  results!: AttendanceResultResponseDTO[];
}
