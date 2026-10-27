// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  Notification,
  NotificationDetails,
} from "../../../domain/notification.entity";
export class PenaltySnapshotDTO {
  @ApiProperty() count!: number;
  @ApiProperty() limit!: number;
  @ApiProperty() windowDays!: number;
  @ApiProperty() blockDays!: number;
  @ApiProperty() remaining!: number;
  @ApiProperty({ type: String, nullable: true }) blockedUntil!: string | null;
}
export class NotificationDetailsDTO {
  @ApiPropertyOptional({ description: "Reason given by the municipality" })
  reason?: string;
  @ApiPropertyOptional({
    type: PenaltySnapshotDTO,
    description: "No-show penalty standing when the notice was created",
  })
  standing?: PenaltySnapshotDTO;
}
export class NotificationResponseDTO {
  @ApiProperty({ description: "Notification UUID" }) id!: string;
  @ApiProperty({ description: "Related reservation" }) bookingId!: string;
  @ApiProperty({
    enum: [
      "confirmed",
      "rescheduled",
      "cancelled",
      "cancelled_by_municipality",
      "no_show",
      "blocked",
      "unblocked",
      "reminder",
    ],
    description: "Event kind",
  })
  kind!: Notification["kind"];
  @ApiProperty({ type: NotificationDetailsDTO, nullable: true })
  details!: NotificationDetails | null;
  @ApiProperty({ description: "Facility display name" }) facilityName!: string;
  @ApiProperty({ description: "Event instant" }) createdAt!: string;
  static from(value: Notification): NotificationResponseDTO {
    return {
      id: value.id,
      bookingId: value.bookingId,
      kind: value.kind,
      details: value.details,
      facilityName: value.facilityName,
      createdAt: value.createdAt.toString(),
    };
  }
}
