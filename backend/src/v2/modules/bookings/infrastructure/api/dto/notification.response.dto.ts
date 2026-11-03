// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  Notification,
  NotificationDetails,
} from "../../../domain/notification.entity";
import { messageKinds } from "../../../../../shared/application/outbox";
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
  @ApiPropertyOptional({
    description: "Until when a waiting-list offer holds the place (#96)",
  })
  offerExpiresAt?: string;
  @ApiPropertyOptional({
    type: [String],
    description: "Start of each cancelled date of an activity (#97)",
  })
  dates?: string[];
}
export class NotificationActivityNameDTO {
  @ApiProperty() gl!: string;
  @ApiProperty({ description: "Empty means use the Galician text" })
  es!: string;
}
export class NotificationResponseDTO {
  @ApiProperty({ description: "Notification UUID" }) id!: string;
  @ApiProperty({
    type: String,
    nullable: true,
    description:
      "Related reservation; null for a waiting-list offer or an enrolment notice",
  })
  bookingId!: string | null;
  @ApiProperty({
    enum: messageKinds,
    description: "Event kind",
  })
  kind!: Notification["kind"];
  @ApiProperty({ type: NotificationDetailsDTO, nullable: true })
  details!: NotificationDetails | null;
  @ApiProperty({ description: "Facility display name" }) facilityName!: string;
  @ApiProperty({ description: "Booked resource UUID" }) resourceId!: string;
  @ApiProperty({ description: "Court or space display name" })
  resourceName!: string;
  @ApiProperty({
    type: String,
    nullable: true,
    description: "Activity of an enrolment notice (#97)",
  })
  activityId!: string | null;
  @ApiProperty({ type: NotificationActivityNameDTO, nullable: true })
  activityName!: NotificationActivityNameDTO | null;
  @ApiProperty({ description: "Event instant" }) createdAt!: string;
  static from(value: Notification): NotificationResponseDTO {
    return {
      id: value.id,
      bookingId: value.bookingId,
      kind: value.kind,
      details: value.details,
      facilityName: value.facilityName,
      resourceId: value.resourceId,
      resourceName: value.resourceName,
      activityId: value.activityId,
      activityName: value.activityName,
      createdAt: value.createdAt.toString(),
    };
  }
}
