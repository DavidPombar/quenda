// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { FacilityReport } from "../../../domain/occupancy";
export class FacilityUsageResponseDTO {
  @ApiProperty({ description: "Facility UUID" }) id!: string;
  @ApiProperty({ description: "Facility display name" }) name!: string;
  @ApiProperty({ description: "Sport" }) sport!: string;
  @ApiProperty({
    description: "Confirmed bookings starting in the range (same as confirmed)",
  })
  bookings!: number;
  @ApiProperty({ description: "Confirmed bookings starting in the range" })
  confirmed!: number;
  @ApiProperty({ description: "Cancelled bookings starting in the range" })
  cancelled!: number;
  @ApiProperty({ description: "Booked minutes within open time" })
  bookedMinutes!: number;
  @ApiProperty({
    description:
      "Open minutes from the calendar while active, minus municipal holidays",
  })
  openMinutes!: number;
  @ApiProperty({
    type: Number,
    nullable: true,
    description: "Booked over open time, rounded percent; null if never open",
  })
  occupancy!: number | null;
  static from(value: FacilityReport): FacilityUsageResponseDTO {
    return {
      id: value.id,
      name: value.name,
      sport: value.sport,
      bookings: value.confirmed,
      confirmed: value.confirmed,
      cancelled: value.cancelled,
      bookedMinutes: value.bookedMinutes,
      openMinutes: value.openMinutes,
      occupancy: value.occupancy,
    };
  }
}
