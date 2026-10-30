// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateIf,
} from "class-validator";
import { allAnalyticsEvents } from "../../../domain/analytics-events";
export class PageViewRequestDTO {
  @ApiProperty({
    enum: ["app", "web"],
    description: "Citizen app or public website",
  })
  @IsIn(["app", "web"])
  app!: "app" | "web";
  @ApiPropertyOptional({
    description: "Municipality slug; required for the citizen app",
  })
  @ValidateIf((object: PageViewRequestDTO) => object.app === "app")
  @IsString()
  @Matches(/^[a-z0-9-]{1,64}$/)
  slug?: string;
  @ApiProperty({ description: "Path of the page; the query string is dropped" })
  @IsString()
  @MaxLength(500)
  path!: string;
  @ApiPropertyOptional({
    enum: allAnalyticsEvents,
    description: "Fixed event name; omitted for a page view",
  })
  @IsOptional()
  @IsIn(allAnalyticsEvents)
  event?: string;
  @ApiProperty({ enum: ["gl", "es"] })
  @IsIn(["gl", "es"])
  language!: string;
  @ApiProperty({ description: "Screen size, e.g. 390x844" })
  @Matches(/^\d{2,5}x\d{2,5}$/)
  screen!: string;
}
