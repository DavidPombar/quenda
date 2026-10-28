// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { ResourceAvailability } from "../../../application/queries/get-availability.query";
import { SlotResponseDTO } from "./slot.response.dto";
export class ResourceAvailabilityResponseDTO {
  @ApiProperty({ description: "Resource UUID" }) id!: string;
  @ApiProperty({ description: "Court or space name" }) name!: string;
  @ApiProperty({
    description: "Composite resource this one is a part of",
    type: String,
    nullable: true,
  })
  parentId!: string | null;
  @ApiProperty({
    description: "In service; out-of-service resources have no slots",
  })
  active!: boolean;
  @ApiProperty({
    description:
      "Slots of the facility calendar; booked when any unit of this resource is occupied",
    type: [SlotResponseDTO],
  })
  slots!: SlotResponseDTO[];
  static from(value: ResourceAvailability): ResourceAvailabilityResponseDTO {
    return {
      id: value.resource.id,
      name: value.resource.name,
      parentId: value.resource.parentId,
      active: value.resource.active,
      slots: value.slots.map(SlotResponseDTO.from),
    };
  }
}
