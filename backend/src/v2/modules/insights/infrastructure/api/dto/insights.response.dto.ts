// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { Insights } from "../../../application/queries/get-insights.query";
import { FacilityUsageResponseDTO } from "./facility-usage.response.dto";
export class InsightsResponseDTO {
  @ApiProperty({ description: "All bookings in the next seven local dates" })
  total!: number;
  @ApiProperty({ description: "Confirmed bookings" }) confirmed!: number;
  @ApiProperty({ description: "Cancelled bookings" }) cancelled!: number;
  @ApiProperty({
    description:
      "Confirmed minutes divided by currently scheduled opening minutes, rounded percent",
  })
  occupancy!: number;
  @ApiProperty({ description: "Number of facilities" }) facilities!: number;
  @ApiProperty({ description: "First included local date" }) from!: string;
  @ApiProperty({ description: "Last included local date" }) to!: string;
  @ApiProperty({
    description: "Usage by facility",
    type: [FacilityUsageResponseDTO],
  })
  byFacility!: FacilityUsageResponseDTO[];
  static from(value: Insights): InsightsResponseDTO {
    return {
      total: value.total,
      confirmed: value.confirmed,
      cancelled: value.cancelled,
      occupancy: value.occupancy,
      facilities: value.facilities,
      from: value.from,
      to: value.to,
      byFacility: value.byFacility.map(FacilityUsageResponseDTO.from),
    };
  }
}
