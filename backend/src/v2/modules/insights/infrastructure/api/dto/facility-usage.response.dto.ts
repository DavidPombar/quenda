// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
export class FacilityUsageResponseDTO {
  @ApiProperty({ description: "Facility UUID" }) id!: string;
  @ApiProperty({ description: "Facility display name" }) name!: string;
  @ApiProperty({ description: "Confirmed bookings in the selected period" })
  bookings!: number;
  @ApiProperty({ description: "Bookings marked as no-show in the period" })
  noShows!: number;
  static from(value: {
    id: string;
    name: string;
    bookings: number;
    noShows: number;
  }) {
    return {
      id: value.id,
      name: value.name,
      bookings: value.bookings,
      noShows: value.noShows,
    };
  }
}
