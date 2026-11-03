// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import type { Insights } from "../../../application/municipality-insights";
export class ActivityFiguresResponseDTO {
  @ApiProperty() id!: string;
  @ApiProperty({ description: "Activity name in Galician" }) name!: string;
  @ApiProperty() facilityName!: string;
  @ApiProperty() places!: number;
  @ApiProperty({ description: "People holding a place now" }) enrolled!: number;
  @ApiProperty({ description: "People on the waiting list now" })
  waiting!: number;
  @ApiProperty({ description: "Sessions in the range that took place" })
  sessions!: number;
  @ApiProperty() cancelledSessions!: number;
  @ApiProperty({ description: "Roll-call marks: present" }) present!: number;
  @ApiProperty({ description: "Roll-call marks: absent" }) absent!: number;
  @ApiProperty({
    type: Number,
    nullable: true,
    description:
      "Present over all marks, rounded percent; null before any roll call",
  })
  attendanceRate!: number | null;
  static from(
    value: Insights["activities"][number],
  ): ActivityFiguresResponseDTO {
    return { ...value };
  }
}
