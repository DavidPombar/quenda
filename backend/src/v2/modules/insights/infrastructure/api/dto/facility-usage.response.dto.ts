// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { FacilityReport, ResourceReport } from "../../../domain/occupancy";
export class ResourceUsageResponseDTO {
  @ApiProperty({ description: "Court UUID" }) id!: string;
  @ApiProperty({ description: "Court display name" }) name!: string;
  @ApiProperty({
    type: String,
    nullable: true,
    description: "Whole court this one is a part of",
  })
  parentId!: string | null;
  @ApiProperty({
    description: "Confirmed bookings of this court starting in the range",
  })
  confirmed!: number;
  @ApiProperty({ description: "Cancelled bookings of this court" })
  cancelled!: number;
  @ApiProperty({ description: "No-shows of this court" }) noShows!: number;
  @ApiProperty({
    description:
      "Booked unit-minutes within open time, including whole-court bookings",
  })
  bookedMinutes!: number;
  @ApiProperty({ description: "Open minutes times the court's units" })
  openMinutes!: number;
  @ApiProperty({ type: Number, nullable: true, description: "Rounded percent" })
  occupancy!: number | null;
  static from(value: ResourceReport): ResourceUsageResponseDTO {
    return { ...value };
  }
}
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
  @ApiProperty({ description: "No-shows among bookings starting in the range" })
  noShows!: number;
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
  @ApiProperty({
    description:
      "Usage by court in service; a whole court aggregates the time of its parts",
    type: [ResourceUsageResponseDTO],
  })
  byResource!: ResourceUsageResponseDTO[];
  static from(value: FacilityReport): FacilityUsageResponseDTO {
    return {
      id: value.id,
      name: value.name,
      sport: value.sport,
      bookings: value.confirmed,
      confirmed: value.confirmed,
      cancelled: value.cancelled,
      noShows: value.noShows,
      bookedMinutes: value.bookedMinutes,
      openMinutes: value.openMinutes,
      occupancy: value.occupancy,
      byResource: value.byResource.map(ResourceUsageResponseDTO.from),
    };
  }
}
