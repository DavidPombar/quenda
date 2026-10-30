// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { FacilityResponseDTO } from "./facility.response.dto";
import { FacilityWithSchedule } from "../../../domain/facility.read-model";
export class OpeningHoursResponseDTO {
  @ApiProperty({ description: "Local opening time, HH:MM" }) from!: string;
  @ApiProperty({ description: "Local closing time, HH:MM" }) to!: string;
}
export class OpeningDayResponseDTO {
  @ApiProperty({ description: "Local date, YYYY-MM-DD" }) date!: string;
  @ApiProperty({
    type: [OpeningHoursResponseDTO],
    description: "Empty when closed",
  })
  hours!: OpeningHoursResponseDTO[];
  @ApiProperty({ description: "Closed for a municipal holiday" })
  holiday!: boolean;
}
export class FacilityScheduleResponseDTO extends FacilityResponseDTO {
  @ApiProperty({
    type: [OpeningDayResponseDTO],
    description: "Opening hours of the next seven days, from today",
  })
  openingWeek!: OpeningDayResponseDTO[];
  static fromSchedule(
    value: FacilityWithSchedule,
  ): FacilityScheduleResponseDTO {
    const time = (value: { toString(options: object): string }) =>
      value.toString({ smallestUnit: "minute" });
    return {
      ...FacilityResponseDTO.from(value),
      openingWeek: value.openingWeek.map((day) => ({
        date: day.date.toString(),
        hours: day.hours.map((hours) => ({
          from: time(hours.from),
          to: time(hours.to),
        })),
        holiday: day.holiday,
      })),
    };
  }
}
