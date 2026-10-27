// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { Notification } from "../../../domain/notification.entity";
export class NotificationResponseDTO {
  @ApiProperty({ description: "Notification UUID" }) id!: string;
  @ApiProperty({ description: "Related reservation" }) bookingId!: string;
  @ApiProperty({ description: "Event kind" }) kind!:
    "confirmed" | "rescheduled" | "cancelled";
  @ApiProperty({ description: "Facility display name" }) facilityName!: string;
  @ApiProperty({ description: "Booked resource UUID" }) resourceId!: string;
  @ApiProperty({ description: "Court or space display name" })
  resourceName!: string;
  @ApiProperty({ description: "Event instant" }) createdAt!: string;
  static from(value: Notification): NotificationResponseDTO {
    return {
      id: value.id,
      bookingId: value.bookingId,
      kind: value.kind,
      facilityName: value.facilityName,
      resourceId: value.resourceId,
      resourceName: value.resourceName,
      createdAt: value.createdAt.toString(),
    };
  }
}
