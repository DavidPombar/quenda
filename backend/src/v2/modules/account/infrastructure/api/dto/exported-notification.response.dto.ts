// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { ExportedNotification } from "../../../domain/account.read-model";
export class ExportedNotificationResponseDTO {
  @ApiProperty({ description: "Notification UUID" }) id!: string;
  @ApiProperty({ description: "Related reservation" }) bookingId!: string;
  @ApiProperty({ description: "Event kind" }) kind!:
    "confirmed" | "rescheduled" | "cancelled";
  @ApiProperty({ description: "Facility display name" }) facilityName!: string;
  @ApiProperty({ description: "Event instant" }) createdAt!: string;
  static from(value: ExportedNotification): ExportedNotificationResponseDTO {
    return {
      id: value.id,
      bookingId: value.bookingId,
      kind: value.kind,
      facilityName: value.facilityName,
      createdAt: value.createdAt.toString(),
    };
  }
}
