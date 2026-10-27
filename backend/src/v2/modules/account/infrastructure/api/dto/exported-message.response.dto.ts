// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { ExportedMessage } from "../../../domain/account.read-model";
export class ExportedMessageResponseDTO {
  @ApiProperty({ description: "Message UUID" }) id!: string;
  @ApiProperty({
    description: "Notice kind",
    enum: ["confirmed", "rescheduled", "cancelled", "reminder"],
  })
  kind!: ExportedMessage["kind"];
  @ApiProperty({ description: "Delivery channel", enum: ["email"] })
  channel!: ExportedMessage["channel"];
  @ApiProperty({ description: "Instant the message was queued" })
  createdAt!: string;
  @ApiProperty({
    description: "Instant it was delivered or closed",
    type: String,
    nullable: true,
  })
  sentAt!: string | null;
  static from(value: ExportedMessage): ExportedMessageResponseDTO {
    return {
      id: value.id,
      kind: value.kind,
      channel: value.channel,
      createdAt: value.createdAt.toString(),
      sentAt: value.sentAt?.toString() ?? null,
    };
  }
}
