// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { ExportedEnrolment } from "../../../domain/account.read-model";
export class ExportedEnrolmentResponseDTO {
  @ApiProperty({ description: "Enrolment UUID" }) id!: string;
  @ApiProperty({ description: "Activity UUID" }) activityId!: string;
  @ApiProperty({
    type: String,
    nullable: true,
    description: "Person in the adult's care who took part; null for the adult",
  })
  dependantId!: string | null;
  @ApiProperty({ description: "Activity name in Galician" })
  activityName!: string;
  @ApiProperty({ description: "Facility display name" }) facilityName!: string;
  @ApiProperty({
    enum: ["enrolled", "waiting", "left", "removed", "cancelled"],
  })
  status!: ExportedEnrolment["status"];
  @ApiProperty({ description: "When the person enrolled" }) createdAt!: string;
  @ApiProperty({
    type: String,
    nullable: true,
    description: "When they got a place",
  })
  enrolledAt!: string | null;
  @ApiProperty({ type: String, nullable: true }) endedAt!: string | null;
  @ApiProperty({
    type: String,
    nullable: true,
    description: "Reason given by the municipality when it removed the person",
  })
  removalReason!: string | null;
  static from(value: ExportedEnrolment): ExportedEnrolmentResponseDTO {
    return {
      ...value,
      createdAt: value.createdAt.toString(),
      enrolledAt: value.enrolledAt?.toString() ?? null,
      endedAt: value.endedAt?.toString() ?? null,
    };
  }
}
