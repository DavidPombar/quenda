// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { Availability } from "../../../application/queries/get-availability.query";
import { ResourceAvailabilityResponseDTO } from "./resource-availability.response.dto";
export class AvailabilityResponseDTO {
  @ApiProperty({
    description: "Availability of each resource, ordered by position and name",
    type: [ResourceAvailabilityResponseDTO],
  })
  resources!: ResourceAvailabilityResponseDTO[];
  static from(value: Availability): AvailabilityResponseDTO {
    return {
      resources: value.resources.map(ResourceAvailabilityResponseDTO.from),
    };
  }
}
