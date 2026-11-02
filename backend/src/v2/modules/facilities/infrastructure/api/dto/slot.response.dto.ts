// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { AvailabilitySlot } from "../../../application/queries/get-availability.query";
export class SlotResponseDTO {
  @ApiProperty({ description: "UTC start instant" }) start!: string;
  @ApiProperty({ description: "UTC end instant" }) end!: string;
  @ApiProperty({
    description:
      "Availability status; no personal data. `season` is a club's season slot (#17), `activity` a municipal activity's session (#97)",
    enum: ["available", "booked", "season", "activity", "past"],
  })
  status!: "available" | "booked" | "season" | "activity" | "past";
  @ApiProperty({
    description: "Places of a shared court (#95); absent for exclusive courts",
    required: false,
  })
  capacity?: number;
  @ApiProperty({
    description: "Places still free in the slot; absent for exclusive courts",
    required: false,
  })
  remaining?: number;
  static from(value: AvailabilitySlot): SlotResponseDTO {
    return {
      start: value.start.toString(),
      end: value.end.toString(),
      status: value.status,
      ...(value.capacity !== undefined && {
        capacity: value.capacity,
        remaining: value.remaining,
      }),
    };
  }
}
