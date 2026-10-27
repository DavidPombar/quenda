// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { Resource } from "../../../domain/resource.entity";
export class ResourceResponseDTO {
  @ApiProperty({ description: "Resource UUID" }) id!: string;
  @ApiProperty({ description: "Court or space name" }) name!: string;
  @ApiProperty({
    description: "Composite resource this one is a part of",
    type: String,
    nullable: true,
  })
  parentId!: string | null;
  @ApiProperty({ description: "In service" }) active!: boolean;
  @ApiProperty({ description: "Display order within the facility" })
  position!: number;
  static from(value: Resource): ResourceResponseDTO {
    return {
      id: value.id,
      name: value.name,
      parentId: value.parentId,
      active: value.active,
      position: value.position,
    };
  }
}
