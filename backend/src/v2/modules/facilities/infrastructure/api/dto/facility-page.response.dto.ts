// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { FacilityResponseDTO } from "./facility.response.dto";
import { FacilityPage } from "../../../domain/facility.read-model";
export class FacilityPageResponseDTO {
  @ApiProperty({ type: [FacilityResponseDTO] }) items!: FacilityResponseDTO[];
  @ApiProperty({ description: "Facilities matching the filters" })
  total!: number;
  @ApiProperty({ description: "1-based page number" }) page!: number;
  @ApiProperty({ description: "Facilities per page" }) pageSize!: number;
  static from(value: FacilityPage): FacilityPageResponseDTO {
    return {
      items: value.items.map(FacilityResponseDTO.from),
      total: value.total,
      page: value.page,
      pageSize: value.pageSize,
    };
  }
}
