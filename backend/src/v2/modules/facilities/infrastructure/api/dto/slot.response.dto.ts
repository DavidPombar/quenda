// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { AvailabilitySlot } from "../../../application/queries/get-availability.query";
export class SlotResponseDTO {
  @ApiProperty({ description: "UTC start instant" }) start!: string;
  @ApiProperty({ description: "UTC end instant" }) end!: string;
  @ApiProperty({ description: "Availability status; no personal data" })
  status!: "available" | "booked" | "past";
  static from(value: AvailabilitySlot): SlotResponseDTO {
    return {
      start: value.start.toString(),
      end: value.end.toString(),
      status: value.status,
    };
  }
}
