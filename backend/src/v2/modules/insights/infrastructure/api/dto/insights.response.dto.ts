// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { Insights } from "../../../application/queries/get-insights.query";
import { FacilityUsageResponseDTO } from "./facility-usage.response.dto";
import { HeatmapCellResponseDTO } from "./heatmap-cell.response.dto";
export class InsightsResponseDTO {
  @ApiProperty({ description: "First included local date" }) from!: string;
  @ApiProperty({ description: "Last included local date" }) to!: string;
  @ApiProperty({ description: "Bookings starting in the range" })
  total!: number;
  @ApiProperty({ description: "Confirmed bookings" }) confirmed!: number;
  @ApiProperty({ description: "Cancelled bookings" }) cancelled!: number;
  @ApiProperty({
    description: "Bookings marked as no-show; not counted as booked time",
  })
  noShows!: number;
  @ApiProperty({ description: "Booked minutes within open time" })
  bookedMinutes!: number;
  @ApiProperty({ description: "Open minutes across facilities" })
  openMinutes!: number;
  @ApiProperty({
    type: Number,
    nullable: true,
    description:
      "Booked over open time, rounded percent; null if nothing opened",
  })
  occupancy!: number | null;
  @ApiProperty({ description: "Number of facilities" }) facilities!: number;
  @ApiProperty({
    description: "Usage by facility",
    type: [FacilityUsageResponseDTO],
  })
  byFacility!: FacilityUsageResponseDTO[];
  @ApiProperty({
    description:
      "Occupancy by local weekday and hour; only cells with open time",
    type: [HeatmapCellResponseDTO],
  })
  heatmap!: HeatmapCellResponseDTO[];
  static from(value: Insights): InsightsResponseDTO {
    return {
      from: value.from,
      to: value.to,
      total: value.total,
      confirmed: value.confirmed,
      cancelled: value.cancelled,
      noShows: value.noShows,
      bookedMinutes: value.bookedMinutes,
      openMinutes: value.openMinutes,
      occupancy: value.occupancy,
      facilities: value.facilities,
      byFacility: value.byFacility.map(FacilityUsageResponseDTO.from),
      heatmap: value.heatmap.map(HeatmapCellResponseDTO.from),
    };
  }
}
