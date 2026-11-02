// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import type {
  WaitlistEntry,
  WaitlistEntryView,
} from "../../../domain/waitlist-entry.entity";

export class WaitlistEntryResponseDTO {
  @ApiProperty({ description: "Entry UUID" }) id!: string;
  @ApiProperty({ description: "Facility UUID" }) facilityId!: string;
  @ApiProperty({ description: "Court or space UUID" }) resourceId!: string;
  @ApiProperty({ description: "Slot start" }) start!: string;
  @ApiProperty({ description: "Slot end" }) end!: string;
  @ApiProperty({
    enum: ["waiting", "offered"],
    description:
      "`offered`: the place is held for the person until offerExpiresAt",
  })
  status!: "waiting" | "offered";
  @ApiProperty({ type: String, nullable: true })
  offerExpiresAt!: string | null;
  @ApiProperty({ description: "When the person joined" }) createdAt!: string;
  static from(value: WaitlistEntry): WaitlistEntryResponseDTO {
    return {
      id: value.id,
      facilityId: value.facilityId,
      resourceId: value.resourceId,
      start: value.start.toString(),
      end: value.end.toString(),
      status: value.status === "offered" ? "offered" : "waiting",
      offerExpiresAt: value.offerExpiresAt?.toString() ?? null,
      createdAt: value.createdAt.toString(),
    };
  }
}
export class WaitlistEntryViewResponseDTO extends WaitlistEntryResponseDTO {
  @ApiProperty({ description: "Facility display name" }) facilityName!: string;
  @ApiProperty({ description: "Court or space display name" })
  resourceName!: string;
  @ApiProperty({
    description:
      "Place among the people still waiting, from 1; 0 while offered",
  })
  position!: number;
  static fromView(value: WaitlistEntryView): WaitlistEntryViewResponseDTO {
    return {
      ...WaitlistEntryResponseDTO.from(value),
      facilityName: value.facilityName,
      resourceName: value.resourceName,
      position: value.position,
    };
  }
}
