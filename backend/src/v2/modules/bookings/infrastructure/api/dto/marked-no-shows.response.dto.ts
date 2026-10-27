// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
export class MarkedNoShowsResponseDTO {
  @ApiProperty({ description: "Bookings marked as no-show" }) marked!: number;
}
