// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { HeatmapCell } from "../../../domain/occupancy";
export class HeatmapCellResponseDTO {
  @ApiProperty({ description: "ISO weekday, 1 = Monday" }) weekday!: number;
  @ApiProperty({ description: "Local hour, 0–23" }) hour!: number;
  @ApiProperty({ description: "Booked minutes within open time" })
  bookedMinutes!: number;
  @ApiProperty({ description: "Open minutes in this weekday and hour" })
  openMinutes!: number;
  @ApiProperty({ description: "Booked over open time, rounded percent" })
  occupancy!: number;
  static from(value: HeatmapCell): HeatmapCellResponseDTO {
    return {
      weekday: value.weekday,
      hour: value.hour,
      bookedMinutes: value.bookedMinutes,
      openMinutes: value.openMinutes,
      occupancy: value.occupancy ?? 0,
    };
  }
}
