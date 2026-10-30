// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import type {
  MunicipalityVisits,
  Ranked,
  SiteReport,
  WebAnalytics,
} from "../../../domain/web-analytics.read-model";
export class RankedResponseDTO {
  @ApiProperty({
    description: "Page path, referrer, device, language or event",
  })
  value!: string;
  @ApiProperty({ description: "Views, or visitors for devices and languages" })
  count!: number;
}
export class SiteReportResponseDTO {
  @ApiProperty() visitors!: number;
  @ApiProperty() visits!: number;
  @ApiProperty() pageviews!: number;
  @ApiProperty({
    type: Number,
    nullable: true,
    description: "Visits with a single page, in percent",
  })
  bounceRate!: number | null;
  @ApiProperty({
    type: Number,
    nullable: true,
    description: "Average visit length in seconds",
  })
  averageVisitSeconds!: number | null;
  @ApiProperty({ type: [RankedResponseDTO] }) pages!: Ranked[];
  @ApiProperty({ type: [RankedResponseDTO] }) referrers!: Ranked[];
  @ApiProperty({ type: [RankedResponseDTO] }) devices!: Ranked[];
  @ApiProperty({ type: [RankedResponseDTO] }) languages!: Ranked[];
  @ApiProperty({ type: [RankedResponseDTO] }) events!: Ranked[];
}
export class MunicipalityVisitsResponseDTO {
  @ApiProperty() slug!: string;
  @ApiProperty() name!: string;
  @ApiProperty() visitors!: number;
  @ApiProperty() visits!: number;
  @ApiProperty() pageviews!: number;
}
export class WebAnalyticsResponseDTO {
  @ApiProperty({
    description: "Whether the deployment can read its Umami statistics",
  })
  available!: boolean;
  @ApiProperty({
    description: "Whether the council has web analytics switched on",
  })
  enabled!: boolean;
  @ApiProperty({ description: "First local date (YYYY-MM-DD)" }) from!: string;
  @ApiProperty({ description: "Last local date, inclusive" }) to!: string;
  @ApiProperty({ type: SiteReportResponseDTO, nullable: true })
  app!: SiteReport | null;
  @ApiProperty({
    type: SiteReportResponseDTO,
    nullable: true,
    description: "Public website; operator only",
  })
  web!: SiteReport | null;
  @ApiProperty({
    type: [MunicipalityVisitsResponseDTO],
    description: "Councils with analytics on; operator only",
  })
  municipalities!: MunicipalityVisits[];
  static from(value: WebAnalytics): WebAnalyticsResponseDTO {
    return { ...value };
  }
}
