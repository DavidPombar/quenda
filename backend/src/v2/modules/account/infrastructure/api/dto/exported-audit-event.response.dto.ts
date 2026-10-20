// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { ExportedAuditEvent } from "../../../domain/account.read-model";
export class ExportedAuditEventResponseDTO {
  @ApiProperty({ description: "Audit event UUID" }) id!: string;
  @ApiProperty({ description: "Action name" }) action!: string;
  @ApiProperty({ description: "Affected resource UUID" }) resourceId!: string;
  @ApiProperty({ description: "Event instant" }) occurredAt!: string;
  @ApiProperty({
    description: "Action-specific detail",
    type: "object",
    additionalProperties: true,
    nullable: true,
  })
  details!: Record<string, unknown> | null;
  static from(value: ExportedAuditEvent): ExportedAuditEventResponseDTO {
    return {
      id: value.id,
      action: value.action,
      resourceId: value.resourceId,
      occurredAt: value.occurredAt.toString(),
      details: value.details,
    };
  }
}
