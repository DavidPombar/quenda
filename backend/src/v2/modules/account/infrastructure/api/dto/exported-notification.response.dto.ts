// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { ExportedNotification } from "../../../domain/account.read-model";
import { messageKinds } from "../../../../../shared/application/outbox";
export class ExportedNotificationResponseDTO {
  @ApiProperty({ description: "Notification UUID" }) id!: string;
  @ApiProperty({
    type: String,
    nullable: true,
    description:
      "Related reservation; null for a waiting-list offer or an enrolment notice",
  })
  bookingId!: string | null;
  @ApiProperty({ description: "Event kind", enum: messageKinds })
  kind!: ExportedNotification["kind"];
  @ApiProperty({
    type: Object,
    nullable: true,
    description: "Municipal reason or penalty standing shown with the notice",
  })
  details!: Record<string, unknown> | null;
  @ApiProperty({ description: "Facility display name" }) facilityName!: string;
  @ApiProperty({ description: "Booked resource UUID" }) resourceId!: string;
  @ApiProperty({ description: "Court or space display name" })
  resourceName!: string;
  @ApiProperty({ description: "Event instant" }) createdAt!: string;
  static from(value: ExportedNotification): ExportedNotificationResponseDTO {
    return {
      id: value.id,
      bookingId: value.bookingId,
      kind: value.kind,
      details: value.details,
      facilityName: value.facilityName,
      resourceId: value.resourceId,
      resourceName: value.resourceName,
      createdAt: value.createdAt.toString(),
    };
  }
}
