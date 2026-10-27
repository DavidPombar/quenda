// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
export class FacilityImpactResponseDTO {
  @ApiProperty({ description: "Upcoming bookings a closure would cancel" })
  bookings!: number;
  @ApiProperty({ description: "Distinct people who would be notified" })
  people!: number;
}
