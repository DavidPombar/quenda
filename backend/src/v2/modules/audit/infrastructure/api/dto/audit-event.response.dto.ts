// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { AuditEntry } from "../../../domain/audit-entry.read-model";
export class AuditEventResponseDTO {
  @ApiProperty({ description: "Audit event UUID" }) id!: string;
  @ApiProperty({ description: "Action name, e.g. booking.created" })
  action!: string;
  @ApiProperty({
    description:
      "Actor user UUID; null for system actions or after retention pseudonymisation",
    type: String,
    nullable: true,
  })
  actorId!: string | null;
  @ApiProperty({
    description: "Actor role",
    enum: ["citizen", "manager", "system"],
    nullable: true,
  })
  actorRole!: "citizen" | "manager" | "system" | null;
  @ApiProperty({
    description: "Actor display name when the actor is still linked",
    type: String,
    nullable: true,
  })
  actorName!: string | null;
  @ApiProperty({ description: "Affected resource UUID" }) resourceId!: string;
  @ApiProperty({ description: "Event instant (ISO 8601)" })
  occurredAt!: string;
  @ApiProperty({
    description: "Action-specific detail",
    type: "object",
    additionalProperties: true,
    nullable: true,
  })
  details!: Record<string, unknown> | null;
  static from(value: AuditEntry): AuditEventResponseDTO {
    return {
      id: value.id,
      action: value.action,
      actorId: value.actorId,
      actorRole: value.actorRole,
      actorName: value.actorName,
      resourceId: value.resourceId,
      occurredAt: value.occurredAt.toString(),
      details: value.details,
    };
  }
}
