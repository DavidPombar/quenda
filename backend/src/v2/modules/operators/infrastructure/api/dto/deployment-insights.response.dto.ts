// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import {
  DeploymentInsights,
  MunicipalityTotals,
} from "../../../application/queries/get-deployment-insights.query";
class TotalsDTO {
  @ApiProperty({ description: "Bookings starting in the range" })
  total!: number;
  @ApiProperty() confirmed!: number;
  @ApiProperty() cancelled!: number;
  @ApiProperty({
    type: Number,
    nullable: true,
    description: "Null until attendance tracking (#16)",
  })
  noShows!: number | null;
  @ApiProperty() bookedMinutes!: number;
  @ApiProperty() openMinutes!: number;
  @ApiProperty({ type: Number, nullable: true }) occupancy!: number | null;
  @ApiProperty({ description: "Number of facilities" }) facilities!: number;
}
export class MunicipalityTotalsResponseDTO extends TotalsDTO {
  @ApiProperty() id!: string;
  @ApiProperty() slug!: string;
  @ApiProperty() name!: string;
  @ApiProperty({ description: "First included local date" }) from!: string;
  @ApiProperty({ description: "Last included local date" }) to!: string;
}
export class DeploymentInsightsResponseDTO extends TotalsDTO {
  @ApiProperty({ type: [MunicipalityTotalsResponseDTO] })
  municipalities!: MunicipalityTotalsResponseDTO[];
  static from(value: DeploymentInsights): DeploymentInsightsResponseDTO {
    const totals = (item: MunicipalityTotals | DeploymentInsights) => ({
      total: item.total,
      confirmed: item.confirmed,
      cancelled: item.cancelled,
      noShows: item.noShows,
      bookedMinutes: item.bookedMinutes,
      openMinutes: item.openMinutes,
      occupancy: item.occupancy,
      facilities: item.facilities,
    });
    return {
      ...totals(value),
      municipalities: value.municipalities.map((item) => ({
        id: item.id,
        slug: item.slug,
        name: item.name,
        from: item.from,
        to: item.to,
        ...totals(item),
      })),
    };
  }
}
