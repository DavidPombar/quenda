// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { ExportedWaitlistEntry } from "../../../domain/account.read-model";
export class ExportedWaitlistEntryResponseDTO {
  @ApiProperty({ description: "Entry UUID" }) id!: string;
  @ApiProperty({ description: "Facility UUID" }) facilityId!: string;
  @ApiProperty({ description: "Facility display name" }) facilityName!: string;
  @ApiProperty({ description: "Court or space UUID" }) resourceId!: string;
  @ApiProperty({ description: "Court or space display name" })
  resourceName!: string;
  @ApiProperty({ description: "Slot start" }) start!: string;
  @ApiProperty({ description: "Slot end" }) end!: string;
  @ApiProperty({
    enum: ["waiting", "offered", "accepted", "expired", "left", "closed"],
  })
  status!: ExportedWaitlistEntry["status"];
  @ApiProperty({ description: "When the person joined" }) createdAt!: string;
  @ApiProperty({
    type: String,
    nullable: true,
    description: "When a freed place was offered",
  })
  offeredAt!: string | null;
  static from(value: ExportedWaitlistEntry): ExportedWaitlistEntryResponseDTO {
    return {
      id: value.id,
      facilityId: value.facilityId,
      facilityName: value.facilityName,
      resourceId: value.resourceId,
      resourceName: value.resourceName,
      start: value.start.toString(),
      end: value.end.toString(),
      status: value.status,
      createdAt: value.createdAt.toString(),
      offeredAt: value.offeredAt?.toString() ?? null,
    };
  }
}
